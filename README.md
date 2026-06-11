# 方塊下落

一個為 iPhone 直向螢幕設計的離線 Web App 小遊戲。玩法採用經典 tetromino 方塊下落規則：10 x 20 棋盤、七種方塊、旋轉、左右移動、加速下落、瞬間落下、保留方塊、消行計分與等級加速。

## 本機執行

這是純靜態 PWA，不需要安裝套件。

```bash
python3 -m http.server 8080
```

然後打開 `http://localhost:8080`。

## iPhone 離線使用

1. 用 iPhone Safari 打開部署後的網址。
2. 點分享按鈕，選「加入主畫面」。
3. 第一次載入完成後，遊戲檔案會透過 service worker 快取，之後可離線開啟。

## 操作

- 點棋盤：旋轉
- 左右滑：左右移動
- 下滑：加速下落
- 上滑：瞬間落下
- 也可以使用畫面底部按鈕操作

鍵盤支援：方向鍵、空白鍵瞬間落下、`C` 保留、`P` 暫停、`R` 重開。

## 發布到 GitHub Pages

1. 建立 GitHub repository，例如 `tetromino-pocket`。
2. 在本機加入遠端並推上去：

```bash
git remote add origin git@github.com:<你的帳號>/tetromino-pocket.git
git branch -M main
git add .
git commit -m "Build offline tetromino web app"
git push -u origin main
```

3. 到 GitHub repository 的 Settings → Pages。
4. Source 選 `Deploy from a branch`，Branch 選 `main` 與 `/root`。

部署完成後，網址通常會是：

```text
https://<你的帳號>.github.io/tetromino-pocket/
```
