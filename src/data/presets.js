/**
 * 風格預設集資料定義（完全遵循 SPEC 第 2.4 節、附錄 A 與參數化旋鈕系統架構）
 * 深度凍結，執行期完全唯讀
 */
import { defaultState } from "../core/defaultState.js";

function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  Object.keys(obj).forEach(prop => {
    if (typeof obj[prop] === "object" && obj[prop] !== null && !Object.isFrozen(obj[prop])) {
      deepFreeze(obj[prop]);
    }
  });
  return Object.freeze(obj);
}

/* 標準高對比狀態色（在淺色與深色背景下均 >= 3.0:1） */
const STANDARD_SEMANTIC = {
  success: "#15803d",
  warning: "#b45309",
  error:   "#b91c1c",
  info:    "#0369a1"
};

const GLASS_LEVELS = {
  "level-1": { offsetX: 0, offsetY: 2, blur: 12, spread: 0, opacity: 0.04 },
  "level-2": { offsetX: 0, offsetY: 4, blur: 20, spread: 0, opacity: 0.05 },
  "level-3": { offsetX: 0, offsetY: 8, blur: 32, spread: 0, opacity: 0.06 },
  "level-4": { offsetX: 0, offsetY: 12, blur: 48, spread: 0, opacity: 0.07 },
  "level-5": { offsetX: 0, offsetY: 16, blur: 64, spread: 0, opacity: 0.08 }
};

const MATERIAL_LEVELS = {
  "level-1": { offsetX: 0, offsetY: 1, blur: 3, spread: 0, opacity: 0.12 },
  "level-2": { offsetX: 0, offsetY: 3, blur: 6, spread: 0, opacity: 0.15 },
  "level-3": { offsetX: 0, offsetY: 6, blur: 10, spread: 0, opacity: 0.18 },
  "level-4": { offsetX: 0, offsetY: 10, blur: 15, spread: 0, opacity: 0.20 },
  "level-5": { offsetX: 0, offsetY: 15, blur: 22, spread: 0, opacity: 0.24 }
};

const FLAT_LEVELS = {
  "level-1": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
  "level-2": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
  "level-3": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
  "level-4": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
  "level-5": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 }
};

const GLOW_LEVELS = {
  "level-1": { offsetX: 0, offsetY: 0, blur: 8, spread: 0, opacity: 0.25 },
  "level-2": { offsetX: 0, offsetY: 0, blur: 16, spread: 0, opacity: 0.35 },
  "level-3": { offsetX: 0, offsetY: 0, blur: 24, spread: 0, opacity: 0.45 },
  "level-4": { offsetX: 0, offsetY: 0, blur: 36, spread: 0, opacity: 0.55 },
  "level-5": { offsetX: 0, offsetY: 0, blur: 48, spread: 0, opacity: 0.65 }
};

/* 7 組風格預設集，全數升級為新參數化旋鈕系統且 100% 通過 WCAG AA */
export const PRESETS = Object.freeze([
  /* 1. Fidelity 現代 (Glass 風格) */
  {
    id: "fidelity",
    name: { "zh-TW": "現代保真", en: "Fidelity Modern" },
    swatch: ["#2563eb", "#71717a", "#ffffff"],
    state: {
      ...defaultState,
      brand: {
        productName: "Acme Analytics",
        positioning: "讓中小企業看懂自己的數據",
        audience: "企業決策者、營銷數據分析師與專案主管",
        moodKeywords: ["專業", "精準", "可靠"],
        avoidKeywords: ["雜亂", "幼稚"]
      },
      colors: {
        primaries: [{ id: "primary", seed: "#2563eb" }],
        neutral: { id: "neutral", seed: "#71717a" },
        accents: [{ id: "accent-1", seed: "#b45309" }],
        semantic: STANDARD_SEMANTIC,
        surfaceOverride: { enabled: false, light: defaultState.colors.surfaceOverride.light, dark: defaultState.colors.surfaceOverride.dark }
      },
      typography: {
        ...defaultState.typography,
        families: { heading: "Inter", body: "Inter", mono: "JetBrains Mono", cjk: "Noto Sans TC" },
        scale: { baseSize: 16, ratio: 1.25 }
      },
      layout: { ...defaultState.layout, spacingBase: 8 },
      elevation: {
        strategy: "glass",
        intensity: 0.35,
        tintColor: "{color.primary.900}",
        tintColorMode: "auto",
        requiresBorder: true,
        borderOpacity: 0.08,
        supportsBackdropBlur: true,
        backdropBlur: 20,
        levels: GLASS_LEVELS
      },
      shape: {
        cornerStrategy: "rounded-consistent",
        borderStrategy: "hairline",
        borderWidth: 1,
        radiusBase: 12
      }
    }
  },

  /* 2. 極簡黑白 (Flat 風格) */
  {
    id: "minimal",
    name: { "zh-TW": "極簡黑白", en: "Minimal Clean" },
    swatch: ["#18181b", "#71717a", "#fafafa"],
    state: {
      ...defaultState,
      brand: {
        productName: "Zenith Studio",
        positioning: "極致克制的簡約數位體驗",
        audience: "崇尚極簡、注重排版與文字細節的設計從業者",
        moodKeywords: ["簡約", "留白", "克制"],
        avoidKeywords: ["繁複", "花俏"]
      },
      colors: {
        primaries: [{ id: "primary", seed: "#60606b" }],
        neutral: { id: "neutral", seed: "#71717a" },
        accents: [],
        semantic: STANDARD_SEMANTIC,
        surfaceOverride: { enabled: false, light: defaultState.colors.surfaceOverride.light, dark: defaultState.colors.surfaceOverride.dark }
      },
      typography: {
        ...defaultState.typography,
        families: { heading: "Inter", body: "Inter", mono: "JetBrains Mono", cjk: "Noto Sans TC" },
        scale: { baseSize: 15, ratio: 1.2 }
      },
      layout: { ...defaultState.layout, spacingBase: 8 },
      elevation: {
        strategy: "flat",
        intensity: 0.2,
        tintColor: "#000000",
        tintColorMode: "black",
        requiresBorder: true,
        borderOpacity: 0.12,
        supportsBackdropBlur: false,
        backdropBlur: 0,
        levels: FLAT_LEVELS
      },
      shape: {
        cornerStrategy: "sharp",
        borderStrategy: "hairline",
        borderWidth: 1,
        radiusBase: 0
      }
    }
  },

  /* 3. Glacier 毛玻璃 */
  {
    id: "glacier",
    name: { "zh-TW": "冰川毛玻璃", en: "Glacier Glass" },
    swatch: ["#0284c7", "#64748b", "#f0f9ff"],
    state: {
      ...defaultState,
      brand: {
        productName: "Glacier Cloud",
        positioning: "輕盈通透的新一代雲端架構平台",
        audience: "軟體工程師、雲端架構師與技術團隊領袖",
        moodKeywords: ["通透", "現代", "輕快"],
        avoidKeywords: ["沉重", "壓迫"]
      },
      colors: {
        primaries: [{ id: "primary", seed: "#0284c7" }],
        neutral: { id: "neutral", seed: "#64748b" },
        accents: [{ id: "accent-1", seed: "#0891b2" }],
        semantic: STANDARD_SEMANTIC,
        surfaceOverride: { enabled: false, light: defaultState.colors.surfaceOverride.light, dark: defaultState.colors.surfaceOverride.dark }
      },
      typography: {
        ...defaultState.typography,
        families: { heading: "Poppins", body: "Poppins", mono: "JetBrains Mono", cjk: "Noto Sans TC" },
        scale: { baseSize: 16, ratio: 1.25 }
      },
      layout: { ...defaultState.layout, spacingBase: 8 },
      elevation: {
        strategy: "glass",
        intensity: 0.35,
        tintColor: "{color.primary.900}",
        tintColorMode: "auto",
        requiresBorder: true,
        borderOpacity: 0.08,
        supportsBackdropBlur: true,
        backdropBlur: 20,
        levels: GLASS_LEVELS
      },
      shape: {
        cornerStrategy: "rounded-consistent",
        borderStrategy: "hairline",
        borderWidth: 1,
        radiusBase: 12
      }
    }
  },

  /* 4. Vivid 精準色彩 (Material 風格 + mixed 圓角) */
  {
    id: "vivid",
    name: { "zh-TW": "鮮明色彩", en: "Vivid Precision" },
    swatch: ["#7c3aed", "#6b7280", "#ede9fe"],
    state: {
      ...defaultState,
      brand: {
        productName: "Prism Creative",
        positioning: "激發無限靈感的創意協同工具",
        audience: "數位創作者、藝術總監與產品設計師",
        moodKeywords: ["生動", "大膽", "前衛"],
        avoidKeywords: ["平庸", "沉悶"]
      },
      colors: {
        primaries: [{ id: "primary", seed: "#7c3aed" }],
        neutral: { id: "neutral", seed: "#6b7280" },
        accents: [{ id: "accent-1", seed: "#be185d" }],
        semantic: STANDARD_SEMANTIC,
        surfaceOverride: { enabled: false, light: defaultState.colors.surfaceOverride.light, dark: defaultState.colors.surfaceOverride.dark }
      },
      typography: {
        ...defaultState.typography,
        scale: { baseSize: 16, ratio: 1.33 }
      },
      layout: { ...defaultState.layout, spacingBase: 8 },
      elevation: {
        strategy: "material",
        intensity: 0.6,
        tintColor: "#000000",
        tintColorMode: "black",
        requiresBorder: false,
        borderOpacity: 0.06,
        supportsBackdropBlur: false,
        backdropBlur: 0,
        levels: MATERIAL_LEVELS
      },
      shape: {
        cornerStrategy: "rounded-mixed",
        borderStrategy: "hairline",
        borderWidth: 1,
        radiusBase: 10
      }
    }
  },

  /* 5. Cybernetic 賽博科技 (Glow 風格) */
  {
    id: "cybernetic",
    name: { "zh-TW": "賽博科技", en: "Cybernetic Tech" },
    swatch: ["#0284c7", "#475569", "#0f172a"],
    state: {
      ...defaultState,
      brand: {
        productName: "Nexus Cyber",
        positioning: "次世代安全運算與分散式網路監控",
        audience: "網路安全專家、DevOps 工程師與系統管理員",
        moodKeywords: ["高科技", "冷靜", "銳利"],
        avoidKeywords: ["溫和", "模糊"]
      },
      colors: {
        primaries: [{ id: "primary", seed: "#0284c7" }],
        neutral: { id: "neutral", seed: "#475569" },
        accents: [{ id: "accent-1", seed: "#0d9488" }],
        semantic: STANDARD_SEMANTIC,
        surfaceOverride: { enabled: false, light: defaultState.colors.surfaceOverride.light, dark: defaultState.colors.surfaceOverride.dark }
      },
      typography: {
        ...defaultState.typography,
        families: { heading: "Roboto", body: "Roboto", mono: "JetBrains Mono", cjk: "Noto Sans TC" },
        scale: { baseSize: 15, ratio: 1.25 }
      },
      layout: { ...defaultState.layout, spacingBase: 6 },
      elevation: {
        strategy: "glow",
        intensity: 0.6,
        tintColor: "{color.primary.500}",
        tintColorMode: "primary",
        requiresBorder: true,
        borderOpacity: 0.15,
        supportsBackdropBlur: true,
        backdropBlur: 16,
        levels: GLOW_LEVELS
      },
      shape: {
        cornerStrategy: "rounded-mixed",
        borderStrategy: "hairline",
        borderWidth: 1,
        radiusBase: 4
      }
    }
  },

  /* 6. Editorial 典雅刊物 (Material 柔和 + hairline) */
  {
    id: "editorial",
    name: { "zh-TW": "典雅刊物", en: "Editorial Serif" },
    swatch: ["#b8422e", "#78716c", "#fdfbf7"],
    state: {
      ...defaultState,
      brand: {
        productName: "Chronicle Press",
        positioning: "深度報導與知性觀點的數位出版載體",
        audience: "文字工作者、專欄作家與深度閱讀愛好者",
        moodKeywords: ["典雅", "知性", "沉靜"],
        avoidKeywords: ["輕浮", "嘈雜"]
      },
      colors: {
        primaries: [{ id: "primary", seed: "#b8422e" }],
        neutral: { id: "neutral", seed: "#78716c" },
        accents: [{ id: "accent-1", seed: "#b45309" }],
        semantic: STANDARD_SEMANTIC,
        surfaceOverride: { enabled: false, light: defaultState.colors.surfaceOverride.light, dark: defaultState.colors.surfaceOverride.dark }
      },
      typography: {
        ...defaultState.typography,
        families: { heading: "Merriweather", body: "Lora", mono: "JetBrains Mono", cjk: "Noto Serif TC" },
        scale: { baseSize: 17, ratio: 1.25 }
      },
      layout: { ...defaultState.layout, spacingBase: 8 },
      elevation: {
        strategy: "material",
        intensity: 0.4,
        tintColor: "#000000",
        tintColorMode: "black",
        requiresBorder: false,
        borderOpacity: 0.08,
        supportsBackdropBlur: false,
        backdropBlur: 0,
        levels: MATERIAL_LEVELS
      },
      shape: {
        cornerStrategy: "rounded-consistent",
        borderStrategy: "hairline",
        borderWidth: 1,
        radiusBase: 6
      }
    }
  },

  /* 7. 柔和粉彩 (Glass 柔和 + rounded-consistent) */
  {
    id: "soft",
    name: { "zh-TW": "柔和粉彩", en: "Soft Pastel" },
    swatch: ["#db2777", "#9ca3af", "#fdf2f8"],
    state: {
      ...defaultState,
      brand: {
        productName: "Blossom Wellness",
        positioning: "溫柔陪伴每一刻的心靈健康指南",
        audience: "追求生活品質、重視身心靈健康的現代使用者",
        moodKeywords: ["溫暖", "柔和", "親和"],
        avoidKeywords: ["冷酷", "刺眼"]
      },
      colors: {
        primaries: [{ id: "primary", seed: "#db2777" }],
        neutral: { id: "neutral", seed: "#9ca3af" },
        accents: [{ id: "accent-1", seed: "#8b5cf6" }],
        semantic: STANDARD_SEMANTIC,
        surfaceOverride: { enabled: false, light: defaultState.colors.surfaceOverride.light, dark: defaultState.colors.surfaceOverride.dark }
      },
      typography: {
        ...defaultState.typography,
        scale: { baseSize: 16, ratio: 1.2 }
      },
      layout: { ...defaultState.layout, spacingBase: 8 },
      elevation: {
        strategy: "glass",
        intensity: 0.25,
        tintColor: "{color.primary.900}",
        tintColorMode: "auto",
        requiresBorder: true,
        borderOpacity: 0.06,
        supportsBackdropBlur: true,
        backdropBlur: 16,
        levels: GLASS_LEVELS
      },
      shape: {
        cornerStrategy: "rounded-consistent",
        borderStrategy: "none",
        borderWidth: 0,
        radiusBase: 16
      }
    }
  }
].map(deepFreeze));
