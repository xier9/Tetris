# JRDN@俄羅斯方塊

一個為 iPhone 直向螢幕設計的離線 Web App 小遊戲。玩法採用經典 tetromino 方塊下落規則：10 x 20 棋盤、七種方塊、旋轉、左右移動、加速下落、瞬間落下、保留方塊、消行計分與等級加速。

遊戲結束時會在本機儲存個人成績排名，顯示名次、分數與等級。

已部署網址：

```text
https://xier9.github.io/Tetris/
```

## 本機執行

這是純靜態 PWA，不需要安裝套件。

```bash
python3 -m http.server 8080
```

然後打開：

```text
http://127.0.0.1:8080/
```

## iPhone 離線使用

1. 用 iPhone Safari 打開 `https://xier9.github.io/Tetris/`。
2. 點分享按鈕，選「加入主畫面」。
3. 第一次載入完成後，遊戲檔案會透過 service worker 快取，之後可離線開啟。

## 操作

- 點棋盤：旋轉
- 左右滑：左右移動
- 下滑：加速下落
- 上滑：瞬間落下
- 也可以使用畫面底部按鈕操作：
  - 左手：旋轉、DROP、HOLD、NEW
  - 右手：左、右、下、PAUSE

鍵盤支援：方向鍵、空白鍵瞬間落下、`C` 保留、`P` 暫停、`R` 重開。

## GitHub Pages 發布資訊

- Repository: `https://github.com/xier9/Tetris`
- Pages: `https://xier9.github.io/Tetris/`
- Source: `main` branch `/`

更新後只要推送到 `main`，GitHub Pages 會自動重新部署。

## 更新快取

如果修改了 HTML、CSS 或 JavaScript，請同步更新 `sw.js` 裡的 `CACHE_NAME`，例如：

```js
const CACHE_NAME = "tetromino-pocket-v6";
```

這可以避免 iPhone 主畫面 App 繼續讀到舊版檔案。
