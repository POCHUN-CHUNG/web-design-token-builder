/**
 * CSS 變數名稱常數表（完全遵循 SPEC 第 4 節與附錄 B）
 * 單一事實來源，禁止在程式碼中直接使用字串字面量
 */

export const TOKEN_NAMES = {
  /* 色彩 - 動態前綴函式 */
  colorGroupStep: (group, step) => `--ds-color-${group}-${step}`,
  colorOnGroup: (group) => `--ds-color-on-${group}`,
  colorSemantic: (name) => `--ds-color-semantic-${name}`,
  colorOnSemantic: (name) => `--ds-color-on-semantic-${name}`,
  COLOR_LINK: "--ds-color-link",

  /* 表面色（依 Light / Dark 模式動態注入） */
  SURFACE_BG: "--ds-surface-bg",
  SURFACE_SURFACE: "--ds-surface-surface",
  SURFACE_RAISED: "--ds-surface-raised",
  SURFACE_TEXT: "--ds-surface-text",
  SURFACE_TEXT_MUTED: "--ds-surface-text-muted",
  SURFACE_BORDER: "--ds-surface-border",
  SURFACE_BORDER_STRONG: "--ds-surface-border-strong",

  /* 字體家族 */
  FONT_HEADING: "--ds-font-heading",
  FONT_BODY: "--ds-font-body",
  FONT_MONO: "--ds-font-mono",
  FONT_CJK: "--ds-font-cjk",

  /* 字級階層動態函式 */
  fontSize: (step) => `--ds-fs-${step}`,
  fontWeight: (step) => `--ds-fw-${step}`,
  lineHeight: (step) => `--ds-lh-${step}`,
  letterSpacing: (step) => `--ds-ls-${step}`,

  /* 繁中排版規則 */
  CJK_LINE_HEIGHT_BOOST: "--ds-cjk-lh-boost",

  /* 間距 */
  SPACE_XS: "--ds-space-xs",
  SPACE_SM: "--ds-space-sm",
  SPACE_MD: "--ds-space-md",
  SPACE_LG: "--ds-space-lg",
  SPACE_XL: "--ds-space-xl",
  SPACE_2XL: "--ds-space-2xl",
  MAX_WIDTH: "--ds-max-width",
  GRID_COLUMNS: "--ds-grid-columns",
  GUTTER: "--ds-gutter",

  /* 圓角與邊框 */
  RADIUS_SM: "--ds-radius-sm",
  RADIUS_MD: "--ds-radius-md",
  RADIUS_LG: "--ds-radius-lg",
  RADIUS_INPUT: "--ds-input-radius",
  RADIUS_CARD: "--ds-card-radius",
  RADIUS_SUBCARD: "--ds-subcard-radius",
  RADIUS_CHECKBOX: "--ds-checkbox-radius",
  RADIUS_XL: "--ds-radius-xl",
  RADIUS_FULL: "--ds-radius-full",
  BORDER_WIDTH: "--ds-border-width",
  BORDER_STYLE: "--ds-border-style",

  /* 深度旋鈕（5 階與附加效果） */
  shadowLevel: (lvl) => `--ds-shadow-${lvl}`,
  ELEVATION_BACKDROP_BLUR: "--ds-elevation-backdrop-blur",
  ELEVATION_BORDER_OPACITY: "--ds-elevation-border-opacity",
  ELEVATION_REQUIRES_BORDER: "--ds-elevation-requires-border",

  /* 動態系統 (Motion) */
  MOTION_DUR_INSTANT: "--ds-motion-dur-instant",
  MOTION_DUR_FAST: "--ds-motion-dur-fast",
  MOTION_DUR_BASE: "--ds-motion-dur-base",
  MOTION_DUR_SLOW: "--ds-motion-dur-slow",
  MOTION_EASE_STANDARD: "--ds-motion-ease-standard",
  MOTION_EASE_DECELERATE: "--ds-motion-ease-decelerate",
  MOTION_EASE_ACCELERATE: "--ds-motion-ease-accelerate",

  /* 空間層級 (Z-Index) */
  Z_BASE: "--ds-z-base",
  Z_DROPDOWN: "--ds-z-dropdown",
  Z_STICKY_HEADER: "--ds-z-sticky-header",
  Z_MODAL_OVERLAY: "--ds-z-modal-overlay",
  Z_MODAL_CONTENT: "--ds-z-modal-content",
  Z_TOAST: "--ds-z-toast",

  /* 按鈕元件 */
  BTN_PADDING_X: "--ds-btn-padding-x",
  BTN_PADDING_Y: "--ds-btn-padding-y",
  BTN_FONT_WEIGHT: "--ds-btn-font-weight",
  BTN_RADIUS: "--ds-btn-radius",
  BTN_HOVER_LIGHTNESS_DELTA: "--ds-btn-hover-lightness-delta",
  BTN_HOVER_COLOR: "--ds-btn-hover-color",
  BTN_HOVER_GLOW: "--ds-btn-hover-glow",
  BTN_ACTIVE_LIGHTNESS_DELTA: "--ds-btn-active-lightness-delta",
  BTN_RING_WIDTH: "--ds-btn-ring-width",
  BTN_RING_OFFSET: "--ds-btn-ring-offset",
  BTN_RING_COLOR: "--ds-btn-ring-color",
  BTN_DISABLED_OPACITY: "--ds-btn-disabled-opacity",

  /* 輸入框元件 */
  INPUT_PADDING_X: "--ds-input-padding-x",
  INPUT_PADDING_Y: "--ds-input-padding-y",
  INPUT_RADIUS: "--ds-input-radius",
  INPUT_HOVER_LIGHTNESS_DELTA: "--ds-input-hover-lightness-delta",
  INPUT_HOVER_COLOR: "--ds-input-hover-color",
  INPUT_RING_WIDTH: "--ds-input-ring-width",
  INPUT_RING_OFFSET: "--ds-input-ring-offset",
  INPUT_RING_COLOR: "--ds-input-ring-color",
  INPUT_DISABLED_OPACITY: "--ds-input-disabled-opacity",

  /* 卡片元件 */
  CARD_PADDING: "--ds-card-padding",
  CARD_RADIUS: "--ds-card-radius",
  CARD_HOVER_LIGHTNESS_DELTA: "--ds-card-hover-lightness-delta"
};
