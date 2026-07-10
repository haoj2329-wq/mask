const state = {
  config: null,
  localPart: null,
  address: null,
  expiresAt: 0,
  timer: null,
  poller: null,
  refreshing: false,
};

const $ = (selector) => document.querySelector(selector);
const elements = {
  address: $("#address"),
  countdown: $("#countdown"),
  copyAddress: $("#copy-address"),
  newMailbox: $("#new-mailbox"),
  extendMailbox: $("#extend-mailbox"),
  refresh: $("#refresh"),
  syncStatus: $("#sync-status"),
  messageCount: $("#message-count"),
  emptyState: $("#empty-state"),
  messageList: $("#message-list"),
  notice: $("#notice"),
  lookup: $("#lookup"),
  lookupButton: $("#lookup-button"),
  dialog: $("#message-dialog"),
  dialogSubject: $("#dialog-subject"),
  dialogSender: $("#dialog-sender"),
  dialogTime: $("#dialog-time"),
  dialogBody: $("#dialog-body"),
  codeCard: $("#code-card"),
  dialogCode: $("#dialog-code"),
  copyCode: $("#copy-code"),
  closeDialog: $("#close-dialog"),
};

async function api(path, options) {
  const response = await fetch(path, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "请求失败");
  return data;
}

function showNotice(message) {
  elements.notice.textContent = message;
  elements.notice.hidden = false;
}

function clearNotice() {
  elements.notice.hidden = true;
  elements.notice.textContent = "";
}

function setSync(label, loading = false) {
  elements.syncStatus.lastChild.textContent = label;
  elements.syncStatus.classList.toggle("loading", loading);
}

function normalizeLookup(value) {
  const clean = value.trim().toLowerCase();
  if (!clean) return null;
  if (clean.includes("@") && !clean.endsWith(`@${state.config.mailDomain}`)) return null;
  const local = clean.split("@")[0];
  return /^[a-z0-9]{6,32}$/.test(local) ? local : null;
}

function useMailbox(mailbox) {
  state.localPart = mailbox.localPart;
  state.address = mailbox.address || `${mailbox.localPart}@${state.config.mailDomain}`;
  state.expiresAt = mailbox.expiresAt;
  localStorage.setItem("91mail:last-mailbox", state.localPart);
  elements.address.textContent = state.address;
  elements.copyAddress.disabled = false;
  elements.extendMailbox.disabled = false;
  elements.refresh.disabled = false;
  clearNotice();
  startTimers();
}

async function createMailbox() {
  elements.newMailbox.disabled = true;
  setSync("正在生成", true);
  try {
    const mailbox = await api("/api/mailboxes", { method: "POST" });
    useMailbox(mailbox);
    renderMessages([]);
    setSync("等待收信");
  } catch (error) {
    showNotice(error.message);
    setSync("生成失败");
  } finally {
    elements.newMailbox.disabled = false;
  }
}

async function refreshMessages({ quiet = false } = {}) {
  if (!state.localPart || state.refreshing) return;
  state.refreshing = true;
  if (!quiet) setSync("正在刷新", true);
  try {
    const data = await api(`/api/mailboxes/${encodeURIComponent(state.localPart)}/messages`);
    state.expiresAt = data.mailbox.expiresAt;
    elements.extendMailbox.disabled = data.mailbox.extensionCount >= 2;
    renderMessages(data.messages);
    clearNotice();
    setSync(data.messages.length ? "收件箱已同步" : "等待收信");
  } catch (error) {
    if (/不存在|过期/.test(error.message)) {
      stopTimers();
      localStorage.removeItem("91mail:last-mailbox");
      elements.extendMailbox.disabled = true;
      elements.refresh.disabled = true;
      elements.countdown.textContent = "已过期";
    }
    if (!quiet || /不存在|过期/.test(error.message)) showNotice(error.message);
    setSync("同步失败");
  } finally {
    state.refreshing = false;
  }
}

function renderMessages(messages) {
  elements.messageList.replaceChildren();
  elements.messageCount.textContent = `${messages.length} 封邮件`;
  elements.emptyState.hidden = messages.length > 0;
  elements.messageList.hidden = messages.length === 0;

  for (const message of messages) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "message-item";
    button.dataset.messageId = message.id;

    const sender = document.createElement("span");
    sender.className = "message-sender";
    sender.textContent = message.sender;

    const subject = document.createElement("span");
    subject.className = "message-subject";
    if (message.verification_code) {
      const code = document.createElement("span");
      code.className = "code-inline";
      code.textContent = message.verification_code;
      subject.append(code);
    }
    subject.append(document.createTextNode(message.subject || "（无主题）"));

    const time = document.createElement("time");
    time.className = "message-time";
    time.dateTime = new Date(message.received_at).toISOString();
    time.textContent = formatTime(message.received_at);

    button.append(sender, subject, time);
    button.addEventListener("click", () => openMessage(message.id));
    elements.messageList.append(button);
  }
}

async function openMessage(id) {
  try {
    setSync("正在读取", true);
    const message = await api(`/api/messages/${encodeURIComponent(id)}`);
    elements.dialogSubject.textContent = message.subject || "（无主题）";
    elements.dialogSender.textContent = message.sender;
    elements.dialogTime.textContent = new Date(message.receivedAt).toLocaleString("zh-CN", { hour12: false });
    elements.dialogBody.textContent = message.textBody || "（邮件没有可显示的纯文本正文）";
    elements.codeCard.hidden = !message.verificationCode;
    elements.dialogCode.textContent = message.verificationCode || "";
    elements.dialog.showModal();
    setSync("收件箱已同步");
  } catch (error) {
    showNotice(error.message);
    setSync("读取失败");
  }
}

async function extendMailbox() {
  if (!state.localPart) return;
  elements.extendMailbox.disabled = true;
  try {
    const data = await api(`/api/mailboxes/${encodeURIComponent(state.localPart)}/extend`, { method: "POST" });
    state.expiresAt = data.expiresAt;
    elements.extendMailbox.disabled = data.extensionCount >= 2;
    clearNotice();
  } catch (error) {
    showNotice(error.message);
  }
}

async function openLookup() {
  const localPart = normalizeLookup(elements.lookup.value);
  if (!localPart) {
    showNotice(`请输入有效的 ${state.config.mailDomain} 邮箱地址或前缀`);
    return;
  }
  state.localPart = localPart;
  state.address = `${localPart}@${state.config.mailDomain}`;
  elements.address.textContent = state.address;
  elements.lookupButton.disabled = true;
  try {
    await refreshMessages();
    if (state.expiresAt > Date.now()) {
      localStorage.setItem("91mail:last-mailbox", localPart);
      elements.copyAddress.disabled = false;
      elements.refresh.disabled = false;
      startTimers();
    }
  } finally {
    elements.lookupButton.disabled = false;
  }
}

function startTimers() {
  stopTimers();
  updateCountdown();
  state.timer = setInterval(updateCountdown, 1000);
  const pollMilliseconds = Math.max(3000, state.config.pollIntervalSeconds * 1000);
  state.poller = setInterval(() => refreshMessages({ quiet: true }), pollMilliseconds);
}

function stopTimers() {
  clearInterval(state.timer);
  clearInterval(state.poller);
  state.timer = null;
  state.poller = null;
}

function updateCountdown() {
  const seconds = Math.max(0, Math.ceil((state.expiresAt - Date.now()) / 1000));
  if (!seconds) {
    elements.countdown.textContent = "已过期";
    stopTimers();
    return;
  }
  const minutes = Math.floor(seconds / 60);
  elements.countdown.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

async function copyText(value, button) {
  try {
    await navigator.clipboard.writeText(value);
    const original = button.textContent;
    button.textContent = "已复制";
    setTimeout(() => { button.textContent = original; }, 1200);
  } catch {
    showNotice("复制失败，请手动选择文本");
  }
}

elements.newMailbox.addEventListener("click", createMailbox);
elements.extendMailbox.addEventListener("click", extendMailbox);
elements.refresh.addEventListener("click", () => refreshMessages());
elements.copyAddress.addEventListener("click", () => copyText(state.address, elements.copyAddress));
elements.lookupButton.addEventListener("click", openLookup);
elements.lookup.addEventListener("keydown", (event) => { if (event.key === "Enter") openLookup(); });
elements.closeDialog.addEventListener("click", () => elements.dialog.close());
elements.copyCode.addEventListener("click", () => copyText(elements.dialogCode.textContent, elements.copyCode));
elements.dialog.addEventListener("click", (event) => { if (event.target === elements.dialog) elements.dialog.close(); });

async function boot() {
  try {
    state.config = await api("/api/config");
    elements.lookup.placeholder = `例如 abc123@${state.config.mailDomain}`;
    const saved = localStorage.getItem("91mail:last-mailbox");
    if (saved) {
      state.localPart = saved;
      state.address = `${saved}@${state.config.mailDomain}`;
      elements.address.textContent = state.address;
      elements.copyAddress.disabled = false;
      elements.refresh.disabled = false;
      await refreshMessages();
      if (state.expiresAt > Date.now()) startTimers();
    } else {
      await createMailbox();
    }
  } catch (error) {
    showNotice(error.message);
    elements.address.textContent = "服务暂时不可用";
    setSync("初始化失败");
  }
}

boot();
