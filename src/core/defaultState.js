/* 系統初始狀態定義（完全遵循 SPEC 第 5.1 節與參數化旋鈕架構） */
export const defaultState = {
  meta: {
    schemaVersion: 5, /* 用於 localStorage 遷移判斷 */
    presetId: "custom", /* preset id 或 "custom" */
    locale: "zh-TW", /* "zh-TW" | "en" */
    previewMode: "light", /* "light" | "dark"，僅影響預覽區 */
    contentLanguage: "zh-TW" /* 使用者輸入文字的語言，寫入匯出檔 */
  },

  ui: {
    activeTab: "preview", /* "preview" | "markdown" */
    leftPanelWidth: 200, /* px */
    panels: { /* 3 個區塊的 UI 狀態 */
      colors:     { open: true, completed: false },
      typography: { open: false, completed: false },
      elevation:  { open: false, completed: false }
    }
  },

  /* ── 區塊 1：色彩 ────────── */
  colors: {
    light: {
      primaries: [
        { id: "primary", seed: "#5b7b88" },
        { id: "primary-2", seed: "#7a5c60" },
        { id: "primary-3", seed: "#617058" }
      ],
      neutral: { id: "neutral", seed: "#8a8b8c" },
      link: { id: "link", seed: "#3a637c" },
      accents: [
        { id: "accent-1", seed: "#5a756b" },
        { id: "accent-2", seed: "#7a5c60" },
        { id: "accent-3", seed: "#8f6d38" },
        { id: "accent-4", seed: "#77718a" },
        { id: "accent-5", seed: "#9e5656" },
        { id: "accent-6", seed: "#806346" }
      ],
      semantic: { success: "#5a756b", warning: "#8f6d38", error: "#9e5656", info: "#5b7b88" },
      surface: { bg: "#ffffff", surface: "#f8fafc", text: "#0f172a", border: "#cbd5e1", btnSecondaryBg: "#f1f5f9", btnInvertedBg: "#0f172a" }
    },
    dark: {
      primaries: [
        { id: "primary", seed: "#5b7b88" },
        { id: "primary-2", seed: "#7a5c60" },
        { id: "primary-3", seed: "#617058" }
      ],
      neutral: { id: "neutral", seed: "#8a8b8c" },
      link: { id: "link", seed: "#3a637c" },
      accents: [
        { id: "accent-1", seed: "#5a756b" },
        { id: "accent-2", seed: "#7a5c60" },
        { id: "accent-3", seed: "#8f6d38" },
        { id: "accent-4", seed: "#77718a" },
        { id: "accent-5", seed: "#9e5656" },
        { id: "accent-6", seed: "#806346" }
      ],
      semantic: { success: "#5a756b", warning: "#8f6d38", error: "#9e5656", info: "#5b7b88" },
      surface: { bg: "#0a0e17", surface: "#111827", text: "#f8fafc", border: "#1e293b", btnSecondaryBg: "#1e293b", btnInvertedBg: "#f8fafc" }
    }
  },

  /* ── 區塊 2：字體排印 ──────────────────────────────── */
  typography: {
    families: {
      heading:    "Noto Sans", /* 英文標題字型 */
      body:       "Noto Sans", /* 英文內文字型 */
      mono:       "JetBrains Mono", /* 英文程式碼/等寬字型 */
      label:      "Noto Sans", /* 英文標籤字型 */
      cjkHeading: "Noto Sans TC", /* 中文標題字型 */
      cjkBody:    "Noto Sans TC", /* 中文內文字型 */
      cjkLabel:   "Noto Sans TC", /* 中文標籤字型 */
      cjk:        "Noto Sans TC" /* 相容回退 */
    },
    scale: {
      baseSize: 18, /* px，body-md 的字級 */
      ratio: 1.25 /* modular scale 比例 */
    },
    overrides: {},
    cjkRules: {
      lineHeightBoost: 0.12, /* 中文行高加成比例，0–0.3 */
      autoSpacing: true, /* 中英數之間自動加半形空白 */
      punctuationCompression: true, /* 標點壓縮 */
      noSyntheticItalic: true /* 禁用合成斜體 */
    }
  },

  /* ── 區塊 3：深度與形狀 ───────────── */
  elevation: {
    strategy: "glass", /* "flat" | "soft" | "crisp" | "glass" */
    intensity: 0.35, /* 0–1，深度強度係數 */
    tintColor: "#0f172a", /* 陰影色調 */
    tintColorMode: "primary", /* "auto" | "primary" | "black" */
    requiresBorder: true, /* 是否需搭配邊框 */
    borderOpacity: 0.08, /* 邊框不透明度 */
    supportsBackdropBlur: true, /* 是否支援毛玻璃模糊 */
    backdropBlur: 12, /* px */
    levels: {
      "level-1": { offsetX: 0, offsetY: 1, blur: 3, spread: 0, opacity: 0.08 },
      "level-2": { offsetX: 0, offsetY: 4, blur: 8, spread: -1, opacity: 0.1 },
      "level-3": { offsetX: 0, offsetY: 10, blur: 20, spread: -3, opacity: 0.12 },
      "level-4": { offsetX: 0, offsetY: 16, blur: 30, spread: -4, opacity: 0.16 },
      "level-5": { offsetX: 0, offsetY: 24, blur: 48, spread: -6, opacity: 0.2 }
    }
  },

  shape: {
    cornerStrategy: "rounded-mixed", /* "rounded-consistent" | "rounded-mixed" | "sharp" */
    borderStrategy: "hairline", /* "none" | "hairline" | "bold" */
    borderWidth: 1, /* px */
    subcardBorderWidth: 1, /* px */
    radiusBase: 30 /* px */
  },

  /* ── 區塊 4：元件樣式 (受 UI 控制) ──────────────────────────────── */
  components: {
    button: { radius: 25 },
    input: { radius: 30 },
    card: { padding: 15, radius: 30, elevation: "{elevation.levels.level-1}" },
    subcard: { padding: 20, radius: 20 },
    checkboxRadio: { radius: 15 }
  }
};
