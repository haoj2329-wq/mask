# 资源说明

本目录用于存放游戏所需的静态资源文件。

## 目录结构

```
public/
└── assets/
    ├── cards/       # 扑克牌图片（52张 + 背面）
    ├── bg/          # 背景图片
    └── music/       # 音频文件
```

## cards/ 目录 - 扑克牌图片

需要以下 53 张图片：

**正面牌（52张）**
命名格式：`{花色}_{点数}.png`

花色：spades(黑桃), hearts(红心), clubs(梅花), diamonds(方块)
点数：A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K

示例文件名：
- spades_A.png
- hearts_10.png
- clubs_Q.png
- diamonds_K.png
- ... 依此类推

**背面牌（1张）**
- back.png

### 免费扑克牌素材来源

1. **Playing Cards Collection (GitHub)**
   https://github.com/htcDeamon/playing-cards-png

2. **Vector Playing Cards**
   https://github.com/smogon/hs13-playingcards

3. **Wikimedia Commons**
   https://commons.wikimedia.org/wiki/Category:Playing_cards

4. **在线扑克牌图片生成器**
   https://www.pokerstars.com/ 或其他扑克网站

## bg/ 目录 - 背景图片

需要：
- **bg-table.jpg** - 赌场桌布背景图

### 免费素材来源

1. **Unsplash** - 免费高清图片
   https://unsplash.com/s/photos/poker-table

2. **Pexels** - 免费图片
   https://www.pexels.com/search/poker%20table/

3. **Pixabay** - 免费图片
   https://pixabay.com/images/search/poker%20table/

## music/ 目录 - 音频文件

需要以下 4 个音频文件：

1. **bgm.mp3** - 背景音乐（建议循环播放的轻松爵士/赌场风格音乐）
2. **card.mp3** - 发牌音效（短促的纸牌声）
3. **win.mp3** - 获胜音效（欢快的胜利音乐）
4. **lose.mp3** - 失败音效（略带遗憾的音效）

### 免费音效来源

1. **Freesound** - 免费音效库
   https://freesound.org/search/?q=casino
   https://freesound.org/search/?q=card+sound

2. **ZapSplat** - 免费音效
   https://www.zapsplat.com/sound-effect/casino/

3. **Mixkit** - 免费音效
   https://mixkit.co/free-sound-effects/

4. **Bensound** - 免费背景音乐
   https://www.bensound.com/

## 替换资源后

替换以上资源后，游戏即可完整运行！
