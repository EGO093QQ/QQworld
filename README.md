# QQ獸世界

QQ獸世界是使用 React、Vite 與 Tailwind CSS 製作的異世界風格卡牌對戰遊戲，玩法基礎參考 Triple Triad，並逐步加入冒險、卡片收集與教師管理內容。

## 已完成

- 3x3 基本對戰棋盤。
- Pointer Events 拖曳放牌，支援桌機與觸控操作。
- 卡片資料庫獨立化。
- 卡片設計器：名稱、插畫、稀有度、四邊點數。
- 使用 localStorage 保存自訂卡片資料。
- 放牌動畫、翻牌動畫與 Game Over 結算。
- Netlify 部署設定。

## 開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
```

## 主要架構

- `src/data/cards.js`：預設卡片資料庫。
- `src/data/cardSchema.js`：卡片資料正規化與舊資料相容處理。
- `src/game/rulesEngine.js`：規則與計分。
- `src/hooks/useGame.js`：遊戲狀態。
- `src/components/`：UI 元件。
- `src/pages/`：主選單、牌組與訓練師頁面。
- `src/storage/`：瀏覽器資料保存。

## 編碼提醒

專案文字檔使用 UTF-8。若在 Windows PowerShell 看到中文亂碼，請用支援 UTF-8 的編輯器開啟，或讀檔時指定 UTF-8 編碼。

```powershell
Get-Content README.md -Encoding UTF8
```

## 下一階段建議

1. Same / Plus / Combo 規則。
2. 電腦 AI。
3. 卡組編成 Deck Builder。
4. 雲端卡片資料庫與圖片儲存。
5. 音效與粒子特效。
6. 線上雙人對戰。
