const ADDRESS_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function randomLocalPart(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (value) => ADDRESS_ALPHABET[value % ADDRESS_ALPHABET.length]).join("");
}

export function normalizeLocalPart(value: string): string | null {
  const decoded = decodeURIComponent(value).trim().toLowerCase();
  const local = decoded.includes("@") ? decoded.split("@", 1)[0] : decoded;
  return /^[a-z0-9]{6,32}$/.test(local) ? local : null;
}

export function truncateUtf8(value: string, maximumBytes: number): string {
  const encoder = new TextEncoder();
  if (encoder.encode(value).byteLength <= maximumBytes) return value;

  let low = 0;
  let high = value.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (encoder.encode(value.slice(0, middle)).byteLength <= maximumBytes) low = middle;
    else high = middle - 1;
  }
  return value.slice(0, low);
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function extractVerificationCode(subject: string, body: string): string | null {
  const content = `${subject}\n${body}`;
  const contextual = [
    /(?:验证码|校验码|动态码|verification\s*code|security\s*code|one[- ]?time\s*(?:password|code)|\botp\b|\bpin\b)[^A-Z0-9]{0,24}([A-Z0-9]{4,8})/i,
    /([A-Z0-9]{4,8})[^A-Z0-9]{0,24}(?:是您的验证码|is your (?:verification|security) code)/i,
  ];
  for (const pattern of contextual) {
    const match = content.match(pattern);
    if (match) return match[1].toUpperCase();
  }
  const subjectMatch = subject.match(/(?:^|\D)(\d{4,8})(?:\D|$)/);
  return subjectMatch?.[1] ?? null;
}

export function boundedInteger(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}
