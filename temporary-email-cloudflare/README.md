# 91Mail 公共临时邮箱

面向 `91mail.org` 的免费公共临时邮箱，仅收信、不发信、不支持附件、没有读取鉴权。知道完整邮箱地址的人都可以读取邮件。

## 功能与限制

- 自动生成 12 位随机地址，默认有效 10 分钟，最多延长到 30 分钟。
- 单邮箱最多 10 封邮件；单封最大 2 MiB；正文最多保存 512 KiB。
- 附件不会保存；HTML 只转换为纯文本，不执行脚本、不加载远程图片。
- 每个 IP 每分钟最多创建 5 个、每小时 10 个、每天 50 个邮箱。
- 同一邮箱每个 IP 每分钟最多读取 20 次，页面每 5 秒刷新。
- 邮件与邮箱到期后由 Cron 每 5 分钟清理。

## 架构

- Cloudflare Worker Static Assets：中文网页。
- Worker `fetch()`：公共邮箱 API。
- Worker `email()`：Email Routing Catch-all 收件。
- Cloudflare D1：邮箱、主题、纯文本正文和验证码。
- Workers KV：简单限流。
- Cron Trigger：删除过期数据。

不需要 Pages、R2、Queues、Durable Objects 或发信服务。

## GitHub 关联 Cloudflare 部署

1. 将本目录作为一个独立 GitHub 仓库推送，默认分支使用 `main`。
2. 打开 Cloudflare 控制台，进入 **Workers & Pages → Create application → Import a repository**。
3. 授权 Cloudflare 只访问这个仓库并选择它。
4. 项目名称填写 `91mail-public-inbox`，部署命令填写 `npm run deploy`。
5. Cloudflare 会按照 `wrangler.jsonc` 创建 Worker、D1、KV 和 Cron，并执行 D1 migration。
6. 部署成功后打开 **Email → Email Routing**，为 `91mail.org` 启用 Email Routing。
7. 在 **Routing Rules → Catch-all** 中选择 **Send to a Worker**，目标选择 `91mail-public-inbox`。
8. 向网页生成的地址发送测试邮件。

首次启用 Email Routing 会由 Cloudflare 添加或提示确认 MX/TXT 记录。这个步骤以及 Catch-all 指向 Worker 需要在控制台手动完成。

## Deploy to Cloudflare 按钮

仓库公开后，可把下面内容加入仓库首页，并替换 URL：

```md
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/你的账号/你的仓库)
```

Deploy Button 可以自动创建 D1 和 KV，但 Email Routing 与 Catch-all 仍需手动启用。

## 不使用 GitHub：Windows 部署

安装 Node.js LTS，解压本项目后双击 `deploy.bat`。脚本会登录 Cloudflare、运行检查、创建资源、迁移数据库并部署。

也可以手动执行：

```bash
npm install
npx wrangler login
npm run typecheck
npm test
npm run deploy
```

## 本地开发

```bash
npm install
npm run dev
```

HTTP API 和静态网页可以在本地调试。Email Worker 可通过 Wrangler 的本地 Email Routing 模拟入口测试；生产收信仍需绑定 Cloudflare Email Routing。

## API

```text
GET  /api/config
POST /api/mailboxes
GET  /api/mailboxes/:localPart/messages
POST /api/mailboxes/:localPart/extend
GET  /api/messages/:messageId
```

这些接口均为公共接口，不要求账号或令牌。系统不提供活跃邮箱目录和全局邮件搜索。

## 上线检查

- `91mail.org` 已使用 Cloudflare DNS，Email Routing 状态为 Enabled。
- Catch-all 已指向 `91mail-public-inbox`。
- Worker 的 D1、KV、Assets 和 Cron bindings 均存在。
- 新建邮箱、收件、验证码提取、延期和到期清理均已测试。
- 管理操作只通过 Cloudflare 控制台完成，不对公网暴露管理 API。

## 使用提示

这是完全公开的临时邮箱。请勿用于支付、密码重置、医疗、工作账户或其他敏感信息。平台不承诺邮件隐私或长期可用性。
