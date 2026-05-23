# 🔒 匿名P2P聊天 (Anonymous P2P Chat)

基于 **WebRTC + PeerJS** 的端到端加密点对点聊天 — 无服务器中转 · 无消息存储 · 无需注册

## ✨ 特性

- **端到端加密**: WebRTC 直连，消息在浏览器间直接传输，不经过任何服务器
- **房间名匹配**: 双方输入相同的房间名即可自动建立 P2P 加密通道
- **完全匿名**: 无需注册、无需账号，自由设置昵称
- **无消息存储**: 聊天内容仅存于内存，关闭页面即永久消失
- **安全指纹**: 显示连接指纹码，可语音/视频确认前4位防止中间人攻击
- **暗色模式**: 自动跟随系统主题
- **单文件 H5**: 纯前端单文件 HTML，托管于 GitHub Pages 即可使用

## 技术架构

```
用户A ← WebRTC P2P → 用户B
        ↓                  ↓
   Cloudflare 信令服务器 (仅用于建立连接，不传输消息)
```

- **信令**: PeerJS (Cloudflare 信令服务器)
- **传输**: WebRTC DataChannel (端到端加密)
- **NAT 穿透**: Google STUN / Cloudflare STUN
- **配对算法**: 房间名 → SHA-like hash → 固定 PeerID，对方通过相同房间名发现

## 使用方式

### 直接访问

打开 GitHub Pages 部署地址即可使用：
```
https://haoj2329-wq.github.io/mask/anonymous-chat.html
```

### 连接流程

1. **双方打开页面**，各自输入昵称和**相同的房间名**
2. 点击「进入房间」→ 自动通过信令服务器发现对方
3. P2P 加密通道建立 → 开始聊天！

> 提示：房间名区分大小写，建议使用简单易记的英文单词（如 `coffee`、`chat123`）

### 通过链接分享

可以在 URL 中携带房间参数，对方点击后自动加入：
```
https://haoj2329-wq.github.io/mask/anonymous-chat.html#room=你的房间名&nick=你的昵称
```

## 部署

### GitHub Pages

Settings → Pages → Source: Deploy from a branch → Branch: `p2ptalk` → Save

### 本地运行

直接用浏览器打开 `anonymous-chat.html`，或使用任意 HTTP 服务器：
```bash
# Python
python -m http.server 9090

# Node.js
npx serve .
```

## 注意事项

- 双方需要**网络可达**（大部分家庭/办公室网络 NAT 可被 STUN 穿透）
- 如果双方都在严格对称 NAT 后，可能需要 TURN 中继（当前版本未配置）
- 聊天内容完全存储在浏览器内存中，刷新页面即清空
