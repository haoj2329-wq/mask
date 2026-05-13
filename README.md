# 拉斯维加斯21点（Blackjack）网页游戏

这是一个精致的网页版拉斯维加斯赌场风格21点扑克牌游戏，支持下注、音效、动画，专业桌面体验，适合直接玩或二次开发。

## 特色

- 精美拉斯维加斯赌场UI，绿色桌布与灯光氛围
- 扑克牌动态发牌动画
- 真实下注筹码玩法
- 庄家真人玩法规则，爆牌、Blackjack、平局
- 背景音乐及发牌/胜负音效
- 100%前端纯静态网页作品（React + TypeScript + Vite）

## 快速运行

1. **安装依赖**

```bash
npm install
```

2. **本地启动开发模式**

```bash
npm run dev
```

打开: http://localhost:5173

3. **打包成静态网页**

```bash
npm run build
```

4. **预览生产构建**

```bash
npm run preview
```

5. **部署到 GitHub Pages / Netlify / Vercel**

将 `dist/` 目录下内容上传即可。

## 目录结构

```
public/
  assets/
    cards/   # 52张牌面图片和back.png
    bg/      # 赌场桌面图片 (bg-table.jpg)
    music/   # 背景音乐及音效 (bgm.mp3, card.mp3, win.mp3, lose.mp3)
src/
  components/       # React主要组件
    GameTable.tsx   # 游戏主界面
    Hand.tsx        # 手牌展示
    BetPanel.tsx    # 下注面板
  utils/
    blackjack.ts    # 游戏核心逻辑
  styles/
    app.css         # 全局样式
    table.css       # 桌面样式
  App.tsx           # 根组件
  index.tsx        # 入口文件
```

## 扑克牌与素材

- 卡面命名格式：`spades_A.png`, `hearts_10.png` ... (共52张 + back.png)
- 背景音乐/音效均可自行更换
- 你也可以用开源素材：
  - https://opengameart.org/
  - https://freesound.org/
  - https://commons.wikimedia.org/ (扑克牌图片)

## 技术栈

- React 18 + TypeScript
- Vite 5 (构建工具)
- Howler.js (音乐/音效集成)
- 纯前端无后端，支持所有现代浏览器

## 致谢

牌面/音效/桌布使用开源免费素材，仅作学习和非商业用途。

---

**Have fun & Good luck!**
