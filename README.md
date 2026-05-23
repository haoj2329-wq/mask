# 🔒 匿名P2P聊天工具 (Anonymous P2P Chat)

真正的点对点加密聊天 — 无服务器中转 · 无消息存储 · 无需注册

## ✨ 特性

- **P2P加密直连**: 基于 WebRTC，聊天内容在浏览器间直接传输，不经过第三方服务器
- **完全匿名**: 无需注册，自由设置昵称
- **QR码配对**: 通过随机生成的连接码和二维码实现配对
- **无消息存储**: 聊天内容仅存于内存，关闭页面即消失
- **H5网页**: 纯前端单文件 HTML，可托管于 GitHub Pages

## 使用方式

直接访问部署后的 URL 即可使用。

### 连接流程
1. 用户A创建房间 → 生成二维码/链接 → 发给用户B
2. 用户B解析连接 → 生成回复二维码 → 发回给用户A
3. 用户A应用回复 → P2P加密通道建立 → 开始聊天！

## 部署 (GitHub Pages)

Settings → Pages → Source: Deploy from a branch → Branch: p2ptalk → Save

访问: `https://haoj2329-wq.github.io/mask/anonymous-chat.html`
