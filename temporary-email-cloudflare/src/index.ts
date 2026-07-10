import PostalMime from "postal-mime";
import {
  boundedInteger,
  extractVerificationCode,
  htmlToPlainText,
  normalizeLocalPart,
  randomLocalPart,
  truncateUtf8,
} from "./helpers";

interface Env {
  DB: D1Database;
  RATE_LIMIT: KVNamespace;
  ASSETS: Fetcher;
  MAIL_DOMAIN: string;
  MAILBOX_NAME_LENGTH?: string;
  MAILBOX_TTL_MINUTES?: string;
  MAILBOX_MAX_TTL_MINUTES?: string;
  MAILBOX_MAX_EXTENSIONS?: string;
  MAX_MESSAGES_PER_MAILBOX?: string;
  MAX_MESSAGE_BYTES?: string;
  MAX_BODY_BYTES?: string;
  CREATE_LIMIT_PER_MINUTE?: string;
  CREATE_LIMIT_PER_HOUR?: string;
  CREATE_LIMIT_PER_DAY?: string;
  READ_LIMIT_PER_MINUTE?: string;
  POLL_INTERVAL_SECONDS?: string;
}

interface MailboxRow {
  local_part: string;
  created_at: number;
  expires_at: number;
  extension_count: number;
  message_count: number;
  total_bytes: number;
}

interface MessageRow {
  id: string;
  sender: string;
  subject: string;
  text_body?: string;
  verification_code: string | null;
  received_at: number;
  size_bytes: number;
}

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store, max-age=0",
  "x-robots-tag": "noindex, nofollow, noarchive",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function error(message: string, status: number): Response {
  return json({ error: message }, status);
}

function clientIp(request: Request): string {
  return request.headers.get("CF-Connecting-IP") ?? "local";
}

async function consumeLimit(env: Env, key: string, limit: number, seconds: number): Promise<boolean> {
  if (limit <= 0) return false;
  const bucket = Math.floor(Date.now() / (seconds * 1000));
  const storageKey = `limit:${key}:${seconds}:${bucket}`;
  const current = Number.parseInt((await env.RATE_LIMIT.get(storageKey)) ?? "0", 10);
  if (current >= limit) return false;
  await env.RATE_LIMIT.put(storageKey, String(current + 1), { expirationTtl: seconds + 60 });
  return true;
}

async function allowCreate(request: Request, env: Env): Promise<boolean> {
  const ip = clientIp(request);
  const limits: Array<[number, number]> = [
    [boundedInteger(env.CREATE_LIMIT_PER_MINUTE, 5, 1, 100), 60],
    [boundedInteger(env.CREATE_LIMIT_PER_HOUR, 10, 1, 1000), 3600],
    [boundedInteger(env.CREATE_LIMIT_PER_DAY, 50, 1, 10000), 86400],
  ];
  for (const [limit, seconds] of limits) {
    if (!(await consumeLimit(env, `create:${ip}`, limit, seconds))) return false;
  }
  return true;
}

async function allowRead(request: Request, env: Env, localPart: string): Promise<boolean> {
  const limit = boundedInteger(env.READ_LIMIT_PER_MINUTE, 20, 1, 1000);
  return consumeLimit(env, `read:${clientIp(request)}:${localPart}`, limit, 60);
}

async function createMailbox(request: Request, env: Env): Promise<Response> {
  if (!(await allowCreate(request, env))) return error("创建过于频繁，请稍后再试", 429);
  const now = Date.now();
  const ttl = boundedInteger(env.MAILBOX_TTL_MINUTES, 10, 5, 60) * 60_000;
  const length = boundedInteger(env.MAILBOX_NAME_LENGTH, 12, 10, 24);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const localPart = randomLocalPart(length);
    const result = await env.DB.prepare(
      "INSERT OR IGNORE INTO mailboxes (local_part, created_at, expires_at) VALUES (?, ?, ?)",
    ).bind(localPart, now, now + ttl).run();
    if (result.meta.changes === 1) {
      return json({
        localPart,
        address: `${localPart}@${env.MAIL_DOMAIN}`,
        createdAt: now,
        expiresAt: now + ttl,
        public: true,
      }, 201);
    }
  }
  return error("暂时无法生成邮箱，请重试", 503);
}

async function getMailbox(localPart: string, env: Env): Promise<MailboxRow | null> {
  return env.DB.prepare(
    "SELECT local_part, created_at, expires_at, extension_count, message_count, total_bytes FROM mailboxes WHERE local_part = ? AND expires_at > ?",
  ).bind(localPart, Date.now()).first<MailboxRow>();
}

async function listMessages(request: Request, localPart: string, env: Env): Promise<Response> {
  if (!(await allowRead(request, env, localPart))) return error("刷新过于频繁，请稍后再试", 429);
  const mailbox = await getMailbox(localPart, env);
  if (!mailbox) return error("邮箱不存在或已过期", 404);

  const result = await env.DB.prepare(
    "SELECT id, sender, subject, verification_code, received_at, size_bytes FROM messages WHERE mailbox_local_part = ? AND expires_at > ? ORDER BY received_at DESC LIMIT 10",
  ).bind(localPart, Date.now()).all<MessageRow>();
  return json({
    mailbox: {
      localPart,
      address: `${localPart}@${env.MAIL_DOMAIN}`,
      expiresAt: mailbox.expires_at,
      extensionCount: mailbox.extension_count,
      messageCount: mailbox.message_count,
    },
    messages: result.results,
  });
}

async function getMessage(request: Request, id: string, env: Env): Promise<Response> {
  const row = await env.DB.prepare(
    `SELECT m.id, m.mailbox_local_part, m.sender, m.subject, m.text_body, m.verification_code,
            m.received_at, m.size_bytes, b.expires_at AS mailbox_expires_at
       FROM messages m JOIN mailboxes b ON b.local_part = m.mailbox_local_part
      WHERE m.id = ? AND m.expires_at > ? AND b.expires_at > ?`,
  ).bind(id, Date.now(), Date.now()).first<MessageRow & { mailbox_local_part: string; mailbox_expires_at: number }>();
  if (!row) return error("邮件不存在或已过期", 404);
  if (!(await allowRead(request, env, row.mailbox_local_part))) return error("读取过于频繁，请稍后再试", 429);
  return json({
    id: row.id,
    sender: row.sender,
    subject: row.subject,
    textBody: row.text_body ?? "",
    verificationCode: row.verification_code,
    receivedAt: row.received_at,
    sizeBytes: row.size_bytes,
  });
}

async function extendMailbox(request: Request, localPart: string, env: Env): Promise<Response> {
  if (!(await allowRead(request, env, localPart))) return error("操作过于频繁，请稍后再试", 429);
  const mailbox = await getMailbox(localPart, env);
  if (!mailbox) return error("邮箱不存在或已过期", 404);

  const maximumExtensions = boundedInteger(env.MAILBOX_MAX_EXTENSIONS, 2, 0, 10);
  if (mailbox.extension_count >= maximumExtensions) return error("已达到最大延期次数", 409);

  const ttl = boundedInteger(env.MAILBOX_TTL_MINUTES, 10, 5, 60) * 60_000;
  const maximumTtl = boundedInteger(env.MAILBOX_MAX_TTL_MINUTES, 30, 10, 240) * 60_000;
  const nextExpiry = Math.min(mailbox.expires_at + ttl, mailbox.created_at + maximumTtl);
  if (nextExpiry <= mailbox.expires_at) return error("已达到最长有效时间", 409);

  await env.DB.prepare(
    "UPDATE mailboxes SET expires_at = ?, extension_count = extension_count + 1 WHERE local_part = ?",
  ).bind(nextExpiry, localPart).run();
  await env.DB.prepare("UPDATE messages SET expires_at = ? WHERE mailbox_local_part = ?")
    .bind(nextExpiry, localPart).run();
  return json({ expiresAt: nextExpiry, extensionCount: mailbox.extension_count + 1 });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);

  if (url.pathname === "/api/config" && request.method === "GET") {
    return json({
      mailDomain: env.MAIL_DOMAIN,
      ttlMinutes: boundedInteger(env.MAILBOX_TTL_MINUTES, 10, 5, 60),
      maxTtlMinutes: boundedInteger(env.MAILBOX_MAX_TTL_MINUTES, 30, 10, 240),
      pollIntervalSeconds: boundedInteger(env.POLL_INTERVAL_SECONDS, 5, 3, 60),
      public: true,
      attachments: false,
    });
  }

  if (url.pathname === "/api/mailboxes" && request.method === "POST") return createMailbox(request, env);

  if (parts[0] === "api" && parts[1] === "mailboxes" && parts[2]) {
    const localPart = normalizeLocalPart(parts[2]);
    if (!localPart) return error("邮箱地址格式无效", 400);
    if (parts[3] === "messages" && request.method === "GET") return listMessages(request, localPart, env);
    if (parts[3] === "extend" && request.method === "POST") return extendMailbox(request, localPart, env);
  }

  if (parts[0] === "api" && parts[1] === "messages" && parts[2] && request.method === "GET") {
    if (!/^[0-9a-f-]{36}$/i.test(parts[2])) return error("邮件ID无效", 400);
    return getMessage(request, parts[2], env);
  }

  return error("接口不存在", 404);
}

async function receiveEmail(message: ForwardableEmailMessage, env: Env): Promise<void> {
  const recipient = message.to.toLowerCase();
  const suffix = `@${env.MAIL_DOMAIN.toLowerCase()}`;
  if (!recipient.endsWith(suffix)) return;
  const localPart = normalizeLocalPart(recipient.slice(0, -suffix.length));
  if (!localPart) return;

  const mailbox = await getMailbox(localPart, env);
  if (!mailbox) return;
  const maximumMessages = boundedInteger(env.MAX_MESSAGES_PER_MAILBOX, 10, 1, 100);
  const maximumBytes = boundedInteger(env.MAX_MESSAGE_BYTES, 2_097_152, 65_536, 10_485_760);
  if (mailbox.message_count >= maximumMessages || message.rawSize > maximumBytes) return;

  const parsed = await PostalMime.parse(message.raw);
  const maximumBodyBytes = boundedInteger(env.MAX_BODY_BYTES, 524_288, 16_384, 1_048_576);
  const sourceBody = parsed.text || (parsed.html ? htmlToPlainText(parsed.html) : "");
  const body = truncateUtf8(sourceBody, maximumBodyBytes);
  const subject = truncateUtf8(parsed.subject ?? "（无主题）", 512);
  const senderAddress = parsed.from?.address || message.from || "未知发件人";
  const senderName = parsed.from?.name ? `${parsed.from.name} <${senderAddress}>` : senderAddress;
  const sender = truncateUtf8(senderName, 512);
  const id = crypto.randomUUID();
  const receivedAt = Date.now();
  const size = Math.min(message.rawSize, maximumBytes);

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO messages
        (id, mailbox_local_part, sender, subject, text_body, verification_code, received_at, size_bytes, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, localPart, sender, subject, body, extractVerificationCode(subject, body), receivedAt, size, mailbox.expires_at),
    env.DB.prepare(
      "UPDATE mailboxes SET message_count = message_count + 1, total_bytes = total_bytes + ? WHERE local_part = ?",
    ).bind(size, localPart),
  ]);
}

async function cleanup(env: Env): Promise<void> {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM messages WHERE expires_at <= ?").bind(now),
    env.DB.prepare("DELETE FROM mailboxes WHERE expires_at <= ?").bind(now),
  ]);
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env);
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      headers.set("x-content-type-options", "nosniff");
      headers.set("referrer-policy", "no-referrer");
      headers.set("x-frame-options", "DENY");
      headers.set("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'");
      headers.set("x-robots-tag", "noindex, nofollow, noarchive");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    } catch (cause) {
      console.error("request_failed", cause instanceof Error ? cause.message : "unknown");
      return error("服务暂时不可用", 500);
    }
  },

  async email(message, env): Promise<void> {
    try {
      await receiveEmail(message, env);
    } catch (cause) {
      console.error("email_processing_failed", cause instanceof Error ? cause.message : "unknown");
    }
  },

  async scheduled(_event, env, ctx): Promise<void> {
    ctx.waitUntil(cleanup(env));
  },
} satisfies ExportedHandler<Env>;
