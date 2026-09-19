# 設計 Token 建構器 (Design Token Builder)

這是一個零依賴 (Zero-dependency) 的網頁版設計工具，用來設計、調和與匯出設計系統。本工具嚴格遵循 WCAG 無障礙設計標準，並支援將設計匯出為 W3C Design Token Community Group (DTCG) 的標準格式。

## 功能特色

- **色彩引擎**：基於 OKLCH 色彩空間，自動產生符合 WCAG AA/AAA 無障礙標準的色階。
- **雙模式色彩獨立編輯**：支援淺色 (Light) 與深色 (Dark) 模式的完全獨立編輯，且新增顏色時會依據模式給予對應的初始色。
- **自訂介面組件**：支援自訂卡片、滑桿、控制項的圓角、邊框等詳細參數，高度彈性。
- **無障礙自動修正**：自動檢查並微調文字或邊框色彩，確保對比度符合無障礙規範。
- **元件與字體排印預覽**：即時預覽各種 UI 元件、版面配置以及字體尺度 (Typographic Scales)。
- **DTCG 標準匯出**：一鍵將設計系統匯出為 W3C DTCG Token 格式，無縫銜接開發流程。
- **URL 狀態同步**：將您的設計系統設定完全編碼於 URL 中，只需複製網址即可與團隊共享。

## 開始使用

### 系統需求
- Node.js (建議使用版本 14 或以上)

### 安裝與啟動
本專案為零依賴架構，無須安裝任何外部套件 (`node_modules`)。您可以選擇以下兩種方式啟動：

1. **直接開啟**：直接雙擊打開專案目錄下的 `index.html` 即可使用。
2. **本地伺服器**：若遇到瀏覽器安全限制 (CORS) 導致功能異常，請啟動本地伺服器：

```bash
# 啟動本地伺服器
npm start
```
接著，打開您的瀏覽器並前往 `http://localhost:3000` 即可使用。

### 建置打包
若要建置正式環境的發布檔案，請執行：
```bash
npm run build
```

### 自動化測試
專案內建統一的測試腳本，用來驗證色彩演算法、匯出資料結構以及多語系邏輯是否正常運作。請執行以下指令進行測試：
```bash
npm test
```

## 目錄結構
- `src/`: 系統核心引擎 (色彩、無障礙、版面、UI 面板、網址編解碼等)。
- `dist/`: 打包後的獨立輸出檔案 (`bundle.js`)。
- `scripts/`: 建置與打包相關的 Node.js 工具腳本。
- `tests/`: 自動化測試與驗證腳本。
- `references/`: 設計系統的相關規格文件與風格範例 (`.md`)。
- `index.html`: 應用程式主入口。

## 授權條款
MIT License

---

# Design Token Builder

This is a zero-dependency web-based design tool for designing, harmonizing, and exporting design systems. It strictly follows WCAG accessibility standards and supports exporting your design to the W3C Design Token Community Group (DTCG) standard format.

## Features

- **Color Engine**: Based on the OKLCH color space, it automatically generates color palettes that comply with WCAG AA/AAA accessibility standards.
- **Independent Dual-Mode Editing**: Supports completely independent editing for Light and Dark modes. When adding new colors, they are seeded appropriately based on the active mode.
- **Customizable UI Components**: Offers high flexibility to customize parameters such as border radius and border width for cards, sliders, and controls.
- **Accessibility Auto-Fix**: Automatically audits and fine-tunes text and border colors to ensure contrast ratios meet accessibility guidelines.
- **Component & Typography Preview**: Live preview of various UI components, layouts, and typographic scales.
- **DTCG Standard Export**: Export your design system to the W3C DTCG Token format with a single click, seamlessly integrating with development workflows.
- **URL State Synchronization**: Your design system configuration is fully encoded in the URL. Simply copy the link to share it with your team.

## Getting Started

### Prerequisites
- Node.js (v14 or above recommended)

### Installation & Launch
This project is built with a zero-dependency architecture. No external packages (`node_modules`) are required. You can choose either of the following ways to start:

1. **Direct Open**: Simply double-click `index.html` in the project directory.
2. **Local Server**: If you encounter browser security restrictions (CORS) that break functionality, please start the local server:

```bash
# Start the local server
npm start
```
Then, open your browser and navigate to `http://localhost:3000`.

### Build
To build the production bundle, run:
```bash
npm run build
```

### Automated Testing
The project includes unified test scripts to verify the color algorithms, export data structures, and multilingual logic. Run the following command to execute the tests:
```bash
npm test
```

## Directory Structure
- `src/`: Core engine (colors, accessibility, layouts, UI panels, URL codec, etc.).
- `dist/`: The standalone output bundle (`bundle.js`).
- `scripts/`: Node.js utility scripts for building and bundling.
- `tests/`: Automated testing and validation scripts.
- `references/`: Design system specifications and style examples (`.md`).
- `index.html`: The main entry point of the application.

## License
MIT License
