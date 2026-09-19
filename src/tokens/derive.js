/* Token 推導引擎（分片記憶化，完全遵循 SPEC 第 3.2、6.7、8.3 節與參數化旋鈕架構） */
import { TOKEN_NAMES } from "./names.js";
import { hexToOklch, oklchToHex, clamp01 } from "../color/convert.js";
import { gamutMap } from "../color/gamut.js";
import { buildRamp, RAMP_STEPS } from "../color/ramp.js";
import { pickOnColor, weakenToLimit, strengthenToMeet, shiftOf } from "../color/contrast.js";

/* 9 階字級階層標準冪次與預設值（SPEC 8.3） */
export const TYPE_SCALE_TABLE = {
  "headline-display": { power: 4,  fw: 700, lh: 1.05, ls: "-0.025em" },
  "headline-lg":      { power: 3,  fw: 700, lh: 1.15, ls: "-0.02em" },
  "headline-md":      { power: 2,  fw: 600, lh: 1.25, ls: "-0.01em" },
  "headline-sm":      { power: 1,  fw: 600, lh: 1.3,  ls: "0em" },
  "body-lg":          { power: 1,  fw: 400, lh: 1.55, ls: "0em" },
  "body-md":          { power: 0,  fw: 400, lh: 1.6,  ls: "0em" },
  "body-sm":          { power: -1, fw: 400, lh: 1.55, ls: "0em" },
  "label-lg":         { power: 0,  fw: 500, lh: 1.4,  ls: "0.01em" },
  "label-md":         { power: -1, fw: 500, lh: 1.35, ls: "0.02em" },
  "label-sm":         { power: -2, fw: 600, lh: 1.3,  ls: "0.04em" }
};

/* 表面色推導輔助函式（SPEC 6.7） */
export function deriveSurfaceColors(neutralRamp, surfaceTokens, mode) {
  let bg, surface, text, border, btnSecondaryBg, btnInvertedBg;

  if (surfaceTokens && surfaceTokens.bg) {
    bg = surfaceTokens.bg;
    surface = surfaceTokens.surface;
    text = surfaceTokens.text;
    border = surfaceTokens.border;
    btnSecondaryBg = surfaceTokens.btnSecondaryBg;
    btnInvertedBg = surfaceTokens.btnInvertedBg;
  } else {
    if (mode === "dark") {
      bg = neutralRamp[10]; /* neutral.950 */
      surface = neutralRamp[9]; /* neutral.900 */
      text = neutralRamp[0]; /* neutral.50 */
      border = neutralRamp[8]; /* neutral.800 */
      btnSecondaryBg = neutralRamp[9]; /* fallback */
      btnInvertedBg = neutralRamp[0]; /* fallback */
    } else {
      bg = neutralRamp[0]; /* neutral.50 */
      surface = "#ffffff";
      text = neutralRamp[10]; /* neutral.950 */
      border = neutralRamp[2]; /* neutral.200 */
      btnSecondaryBg = neutralRamp[1]; /* fallback */
      btnInvertedBg = neutralRamp[10]; /* fallback */
    }
  }

  /* surface-raised：surface 往 text 方向偏移 OKLCH L 值 0.03 */
  const surfLch = hexToOklch(surface);
  const textLch = hexToOklch(text);
  const dirRaised = textLch.L > surfLch.L ? 1 : -1;
  const surfaceRaised = oklchToHex(gamutMap(clamp01(surfLch.L + dirRaised * 0.03), surfLch.C, surfLch.H));

  /* text-muted 自適應推導（同時滿足 bg 與 surface 4.5:1，取保守者） */
  const a = weakenToLimit(text, bg, 4.5);
  const b = weakenToLimit(text, surface, 4.5);
  const textMuted = shiftOf(a, text) < shiftOf(b, text) ? a : b;

  /* border-strong 自適應推導（雙向搜尋遠離 bg 直到 >= 3.0:1） */
  const borderStrong = strengthenToMeet(border, bg, 3.0);

  /* 若舊狀態中未定義按鈕背景色，則提供備用回退值 */
  if (!btnSecondaryBg) btnSecondaryBg = surfaceRaised;
  if (!btnInvertedBg) btnInvertedBg = text;

  return {
    bg,
    surface,
    surfaceRaised,
    text,
    textMuted,
    border,
    borderStrong,
    btnSecondaryBg,
    btnInvertedBg
  };
}

function parseHexRgb(hex) {
  if (!hex || typeof hex !== "string") return [0, 0, 0];
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16)
    ];
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16)
    ];
  }
  return [0, 0, 0];
}

/* 記憶化快取存放處 */
let lastColorsInput = null;
let lastColorsMode = null;
let cachedColorsTokens = null;
let cachedRamps = null;

let lastTypeInput = null;
let cachedTypeTokens = null;

let lastShapeInput = null;
let cachedShapeTokens = null;

let lastElevationInput = null;
let cachedElevationTokens = null;

let lastComponentsInput = null;
let lastComponentsColorsRef = null;
let cachedComponentsTokens = null;

/* 切片 1: Colors */
function deriveColors(colors, previewMode) {
  if (colors === lastColorsInput && previewMode === lastColorsMode && cachedColorsTokens) {
    return { tokens: cachedColorsTokens, ramps: cachedRamps };
  }

  const tokens = {};
  const ramps = {};

  const currentColors = colors[previewMode] || colors.light;
  if (!currentColors) return { tokens, ramps };

  /* 1. 主色群組 (1–3) */
  for (const primary of currentColors.primaries) {
    const ramp = buildRamp(primary.seed, false);
    ramps[primary.id] = ramp;
    RAMP_STEPS.forEach((step, idx) => {
      tokens[TOKEN_NAMES.colorGroupStep(primary.id, step)] = ramp[idx];
    });
    tokens[TOKEN_NAMES.colorOnGroup(primary.id)] = pickOnColor(ramp[5], ramp, 4.5);
  }

  /* 2. 中性色 (固定 1) */
  const neutralRamp = buildRamp(currentColors.neutral.seed, true);
  ramps["neutral"] = neutralRamp;
  RAMP_STEPS.forEach((step, idx) => {
    tokens[TOKEN_NAMES.colorGroupStep("neutral", step)] = neutralRamp[idx];
  });
  tokens[TOKEN_NAMES.colorOnGroup("neutral")] = pickOnColor(neutralRamp[5], neutralRamp, 4.5);

  /* 2.5 超連結色 (Link Color) */
  const linkSeed = currentColors.link?.seed || currentColors.primaries?.[0]?.seed || "#7F5539";
  tokens[TOKEN_NAMES.COLOR_LINK] = linkSeed;
  const linkRamp = buildRamp(linkSeed, false);
  ramps["link"] = linkRamp;
  RAMP_STEPS.forEach((step, idx) => {
    tokens[TOKEN_NAMES.colorGroupStep("link", step)] = linkRamp[idx];
  });
  tokens[TOKEN_NAMES.colorOnGroup("link")] = pickOnColor(linkRamp[5], linkRamp, 4.5);

  /* 3. 輔助色 (0–6) */
  if (currentColors.accents) {
    for (const accent of currentColors.accents) {
      const ramp = buildRamp(accent.seed, false);
      ramps[accent.id] = ramp;
      RAMP_STEPS.forEach((step, idx) => {
        tokens[TOKEN_NAMES.colorGroupStep(accent.id, step)] = ramp[idx];
      });
      tokens[TOKEN_NAMES.colorOnGroup(accent.id)] = pickOnColor(ramp[5], ramp, 4.5);
    }
  }

  /* 4. 狀態色 (固定 4) */
  const semantic = currentColors.semantic || {};
  for (const [key, seed] of Object.entries(semantic)) {
    tokens[TOKEN_NAMES.colorSemantic(key)] = seed;
    const semRamp = buildRamp(seed, false);
    tokens[TOKEN_NAMES.colorOnSemantic(key)] = pickOnColor(seed, semRamp, 4.5);
  }

  /* 5. 表面色（依 Light / Dark 模式） */
  const surfaces = deriveSurfaceColors(neutralRamp, currentColors.surface, previewMode);
  tokens[TOKEN_NAMES.SURFACE_BG] = surfaces.bg;
  tokens[TOKEN_NAMES.SURFACE_SURFACE] = surfaces.surface;
  tokens[TOKEN_NAMES.SURFACE_RAISED] = surfaces.surfaceRaised;
  tokens[TOKEN_NAMES.SURFACE_TEXT] = surfaces.text;
  tokens[TOKEN_NAMES.SURFACE_TEXT_MUTED] = surfaces.textMuted;
  tokens[TOKEN_NAMES.SURFACE_BORDER] = surfaces.border;
  tokens[TOKEN_NAMES.SURFACE_BORDER_STRONG] = surfaces.borderStrong;
  tokens["--ds-btn-secondary-bg"] = surfaces.btnSecondaryBg;
  tokens["--ds-btn-inverted-bg"] = surfaces.btnInvertedBg;

  lastColorsInput = colors;
  lastColorsMode = previewMode;
  cachedColorsTokens = tokens;
  cachedRamps = ramps;

  return { tokens, ramps };
}

/* 切片 2: Typography */
function deriveTypography(typography) {
  if (typography === lastTypeInput && cachedTypeTokens) {
    return cachedTypeTokens;
  }

  const tokens = {};
  const { families, scale, overrides, cjkRules } = typography;

  const cjkHeading = families.cjkHeading || families.cjk || "Noto Sans TC";
  const cjkBody = families.cjkBody || families.cjk || "Noto Sans TC";
  const cjkLabel = families.cjkLabel || families.cjk || "Noto Sans TC";

  tokens[TOKEN_NAMES.FONT_HEADING] = families.heading ? `"${families.heading}", "${cjkHeading}"` : `"${cjkHeading}"`;
  tokens[TOKEN_NAMES.FONT_BODY] = families.body ? `"${families.body}", "${cjkBody}"` : `"${cjkBody}"`;
  tokens[TOKEN_NAMES.FONT_MONO] = families.body ? `"${families.body}", "${cjkBody}"` : `"${cjkBody}"`;
  tokens["--ds-font-label"] = `"${families.label || families.heading || families.body || 'Roboto'}", "${cjkLabel}"`;
  tokens[TOKEN_NAMES.FONT_CJK] = cjkBody;

  tokens[TOKEN_NAMES.CJK_LINE_HEIGHT_BOOST] = `${1 + (cjkRules?.lineHeightBoost || 0)}`;

  const baseSize = scale.baseSize || 16;
  const ratio = scale.ratio || 1.25;

  for (const [step, def] of Object.entries(TYPE_SCALE_TABLE)) {
    const computedSize = Math.round(baseSize * Math.pow(ratio, def.power));
    const ovr = overrides?.[step] || {};

    tokens[TOKEN_NAMES.fontSize(step)] = `${ovr.fontSize ?? computedSize}px`;
    tokens[TOKEN_NAMES.fontWeight(step)] = `${ovr.fontWeight ?? def.fw}`;
    tokens[TOKEN_NAMES.lineHeight(step)] = `${ovr.lineHeight ?? def.lh}`;
    tokens[TOKEN_NAMES.letterSpacing(step)] = typeof ovr.letterSpacing !== "undefined"
      ? (typeof ovr.letterSpacing === "number" ? `${ovr.letterSpacing}em` : ovr.letterSpacing)
      : def.ls;
  }

  lastTypeInput = typography;
  cachedTypeTokens = tokens;
  return tokens;
}


/* 切片 4: Shape（支援 cornerStrategy 與 borderStrategy 旋鈕） */
function deriveShape(shape) {
  if (shape === lastShapeInput && cachedShapeTokens) {
    return cachedShapeTokens;
  }

  const tokens = {};
  const base = shape.radiusBase ?? 12;
  const strat = shape.cornerStrategy || "rounded-consistent";

  let sm, md, lg, xl;
  if (strat === "sharp") {
    sm = 0;
    md = 0;
    lg = 0;
    xl = 0;
  } else if (strat === "rounded-mixed") {
    sm = 4;
    md = 6;
    lg = 18;
    xl = 24;
  } else if (strat === "rounded-fixed") {
    sm = base;
    md = base;
    lg = base;
    xl = base;
  } else {
    /* rounded-consistent (等比放大) */
    sm = Math.round(base * 0.5);
    md = base;
    lg = Math.round(base * 1.5);
    xl = base * 2;
  }

  tokens[TOKEN_NAMES.RADIUS_SM] = `${sm}px`;
  tokens[TOKEN_NAMES.RADIUS_MD] = `${md}px`;
  tokens[TOKEN_NAMES.RADIUS_LG] = `${lg}px`;
  tokens[TOKEN_NAMES.RADIUS_XL] = `${xl}px`;
  tokens[TOKEN_NAMES.RADIUS_FULL] = "9999px";

  let bw = 1;
  const bStrat = shape.borderStrategy || "hairline";
  if (bStrat === "none") {
    bw = 0;
  } else if (bStrat === "bold") {
    bw = Math.max(2, shape.borderWidth ?? 2);
  } else {
    /* hairline */
    bw = shape.borderWidth ?? 1;
  }

  tokens[TOKEN_NAMES.BORDER_WIDTH] = `${bw}px`;
  tokens["--ds-subcard-border-width"] = `${shape.subcardBorderWidth ?? 1}px`;
  tokens[TOKEN_NAMES.BORDER_STYLE] = bw === 0 ? "none" : (shape.borderStyle || "solid");

  lastShapeInput = shape;
  cachedShapeTokens = tokens;
  return tokens;
}

/* 切片 5: Elevation（支援 material, glass, flat, glow 與智慧 tintColor） */
function deriveElevation(elevation, primaryColor = "#0284c7", primary900 = "#001f33") {
  if (elevation === lastElevationInput && cachedElevationTokens) {
    return cachedElevationTokens;
  }

  const tokens = {};
  const {
    strategy = "glass",
    intensity = 0.35,
    tintColorMode = "auto",
    requiresBorder = true,
    borderOpacity = 0.08,
    supportsBackdropBlur = true,
    backdropBlur = 20,
    levels = {}
  } = elevation;

  /* 決定陰影基色 rgb */
  let shadowRgb = [0, 0, 0];
  if (tintColorMode === "primary") {
    shadowRgb = parseHexRgb(primary900 || primaryColor);
  } else if (tintColorMode === "black") {
    shadowRgb = [0, 0, 0];
  } else {
    /* "auto" 智慧預設：glass 或 glow 使用品牌色；material 或 flat 使用純黑 */
    if (strategy === "glass" || strategy === "glow") {
      shadowRgb = parseHexRgb(primary900 || primaryColor);
    } else {
      shadowRgb = [0, 0, 0];
    }
  }

  const intensityFactor = intensity / 0.35;

  const defaultSoft = {
    1: { offsetY: 2, blur: 8, opacity: 0.08 },
    2: { offsetY: 6, blur: 18, opacity: 0.10 },
    3: { offsetY: 16, blur: 36, opacity: 0.14 },
    4: { offsetY: 24, blur: 48, opacity: 0.18 },
    5: { offsetY: 32, blur: 64, opacity: 0.22 }
  };

  const defaultCrisp = {
    1: { offsetY: 2, blur: 4, opacity: 0.18 },
    2: { offsetY: 5, blur: 12, opacity: 0.24 },
    3: { offsetY: 12, blur: 24, opacity: 0.32 },
    4: { offsetY: 18, blur: 32, opacity: 0.38 },
    5: { offsetY: 24, blur: 40, opacity: 0.44 }
  };

  const defaultGlass = {
    1: { offsetY: 3, blur: 12, opacity: 0.10 },
    2: { offsetY: 6, blur: 24, opacity: 0.16 },
    3: { offsetY: 12, blur: 40, opacity: 0.22 },
    4: { offsetY: 16, blur: 52, opacity: 0.26 },
    5: { offsetY: 20, blur: 64, opacity: 0.30 }
  };

  const defaultMaterial = {
    1: { offsetY: 2, blur: 5, opacity: 0.14 },
    2: { offsetY: 6, blur: 14, opacity: 0.20 },
    3: { offsetY: 12, blur: 26, opacity: 0.26 },
    4: { offsetY: 16, blur: 34, opacity: 0.30 },
    5: { offsetY: 22, blur: 44, opacity: 0.34 }
  };

  const defaultGlow = {
    1: { offsetY: 0, blur: 14, opacity: 0.35 },
    2: { offsetY: 0, blur: 26, opacity: 0.55 },
    3: { offsetY: 0, blur: 42, opacity: 0.75 },
    4: { offsetY: 0, blur: 54, opacity: 0.85 },
    5: { offsetY: 0, blur: 64, opacity: 0.95 }
  };

  for (let i = 1; i <= 5; i++) {
    const key = TOKEN_NAMES.shadowLevel(i);
    if (strategy === "flat") {
      tokens[key] = "none";
      continue;
    }

    const lvlObj = levels[`level-${i}`] || {};
    const lvlVal = lvlObj.$value || lvlObj;

    let baseDef = defaultSoft[i];
    if (strategy === "crisp" || strategy === "material") baseDef = defaultCrisp[i];
    else if (strategy === "glow") baseDef = defaultGlow[i];
    else if (strategy === "glass") baseDef = defaultGlass[i];

    const offsetY = lvlVal.offsetY?.value ?? lvlVal.offsetY ?? baseDef.offsetY;
    const blur = lvlVal.blur?.value ?? lvlVal.blur ?? baseDef.blur;
    const spread = lvlVal.spread?.value ?? lvlVal.spread ?? (baseDef.spread || 0);
    const rawOpacity = lvlVal.opacity ?? baseDef.opacity;
    const op = Math.min(1, Math.max(0, rawOpacity * intensityFactor)).toFixed(3);

    if (strategy === "glow") {
      tokens[key] = `0 0 ${blur}px rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, ${op})`;
    } else if (strategy === "brutal") {
      const offset = Math.max(1, offsetY);
      tokens[key] = `${offset}px ${offset}px 0px 0px var(--ds-surface-text, #16181d)`;
    } else if (strategy === "crisp" || strategy === "material") {
      const op2 = Math.min(1, Math.max(0, op * 0.75)).toFixed(3);
      tokens[key] = `0 ${offsetY}px ${blur}px ${spread}px rgba(0, 0, 0, ${op}), 0 1px 2px rgba(0, 0, 0, ${op2})`;
    } else {
      const op2 = (op * 0.6).toFixed(3);
      tokens[key] = `0 ${offsetY}px ${blur}px ${spread}px rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, ${op}), 0 ${Math.max(1, Math.round(offsetY * 0.3))}px ${Math.max(2, Math.round(blur * 0.25))}px rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, ${op2})`;
    }
  }

  /* 毛玻璃模糊與邊框 */
  const isGlass = strategy === "glass";
  const isFlat = strategy === "flat";
  const isMaterial = strategy === "material";
  const isGlow = strategy === "glow";
  const isBrutal = strategy === "brutal";

  tokens[TOKEN_NAMES.ELEVATION_BACKDROP_BLUR] = (isGlass && supportsBackdropBlur) ? `${backdropBlur || 20}px` : "0px";
  tokens[TOKEN_NAMES.ELEVATION_BORDER_OPACITY] = `${borderOpacity ?? (requiresBorder ? 0.08 : 0)}`;
  tokens[TOKEN_NAMES.ELEVATION_REQUIRES_BORDER] = (requiresBorder && !isMaterial) ? "1px solid" : "none";

  tokens["--ds-elevation-strategy"] = strategy;
  tokens["--ds-elevation-border"] = isMaterial ? "none" : (isBrutal ? "2px solid var(--ds-surface-text, #16181d)" : (isGlow ? `1px solid rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, 0.5)` : (isGlass ? `1px solid rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, 0.15)` : "1px solid var(--ds-surface-border, #e2e5ea)")));

  if (isFlat) {
    tokens["--ds-elevation-bg-1"] = "var(--ds-surface-surface, #ffffff)";
    tokens["--ds-elevation-bg-2"] = "var(--ds-color-neutral-100, #f4f4f5)";
    tokens["--ds-elevation-bg-3"] = "var(--ds-color-neutral-200, #e4e4e7)";
    tokens["--ds-elevation-border-1"] = "1px solid var(--ds-surface-border, #e2e5ea)";
    tokens["--ds-elevation-border-2"] = "1.5px solid var(--ds-surface-border, #d1d5db)";
    tokens["--ds-elevation-border-3"] = "2px solid var(--ds-color-neutral-400, #9ca3af)";
  } else if (isGlass) {
    tokens["--ds-elevation-bg-1"] = "color-mix(in srgb, var(--ds-surface-surface, #ffffff) 80%, transparent)";
    tokens["--ds-elevation-bg-2"] = "color-mix(in srgb, var(--ds-surface-surface, #ffffff) 88%, transparent)";
    tokens["--ds-elevation-bg-3"] = "color-mix(in srgb, var(--ds-surface-surface, #ffffff) 94%, transparent)";
    tokens["--ds-elevation-border-1"] = `1px solid rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, 0.15)`;
    tokens["--ds-elevation-border-2"] = `1px solid rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, 0.22)`;
    tokens["--ds-elevation-border-3"] = `1px solid rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, 0.30)`;
  } else if (isGlow) {
    tokens["--ds-elevation-bg-1"] = "var(--ds-surface-surface, #ffffff)";
    tokens["--ds-elevation-bg-2"] = "var(--ds-surface-surface, #ffffff)";
    tokens["--ds-elevation-bg-3"] = "var(--ds-surface-surface, #ffffff)";
    tokens["--ds-elevation-border-1"] = `1px solid rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, 0.40)`;
    tokens["--ds-elevation-border-2"] = `1px solid rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, 0.65)`;
    tokens["--ds-elevation-border-3"] = `1px solid rgba(${shadowRgb[0]}, ${shadowRgb[1]}, ${shadowRgb[2]}, 0.90)`;
  } else if (isBrutal) {
    tokens["--ds-elevation-bg-1"] = "var(--ds-surface-surface, #ffffff)";
    tokens["--ds-elevation-bg-2"] = "var(--ds-surface-surface, #ffffff)";
    tokens["--ds-elevation-bg-3"] = "var(--ds-surface-surface, #ffffff)";
    tokens["--ds-elevation-border-1"] = "2px solid var(--ds-surface-text, #16181d)";
    tokens["--ds-elevation-border-2"] = "2px solid var(--ds-surface-text, #16181d)";
    tokens["--ds-elevation-border-3"] = "2px solid var(--ds-surface-text, #16181d)";
  } else {
    /* Material */
    tokens["--ds-elevation-bg-1"] = "var(--ds-surface-surface, #ffffff)";
    tokens["--ds-elevation-bg-2"] = "var(--ds-surface-surface, #ffffff)";
    tokens["--ds-elevation-bg-3"] = "var(--ds-surface-surface, #ffffff)";
    tokens["--ds-elevation-border-1"] = "none";
    tokens["--ds-elevation-border-2"] = "none";
    tokens["--ds-elevation-border-3"] = "none";
  }

  lastElevationInput = elevation;
  cachedElevationTokens = tokens;
  return tokens;
}

/* 切片 6: Components */
function deriveComponents(components, shapeTokens, colorsTokens) {
  if (components === lastComponentsInput && colorsTokens === lastComponentsColorsRef && cachedComponentsTokens) {
    return cachedComponentsTokens;
  }

  const tokens = {};
  const btn = components.button || {};
  const input = components.input || {};
  const card = components.card || {};

  /* 按鈕 */
  const btnSize = btn.size || "md";
  let btnPadX = btn.paddingX ?? 16;
  let btnPadY = btn.paddingY ?? 10;
  let btnFontSize = 14;
  if (btnSize === "sm") {
    btnPadX = 12;
    btnPadY = 6;
    btnFontSize = 13;
  } else if (btnSize === "lg") {
    btnPadX = 20;
    btnPadY = 14;
    btnFontSize = 16;
  }

  tokens[TOKEN_NAMES.BTN_PADDING_X] = `${btnPadX}px`;
  tokens[TOKEN_NAMES.BTN_PADDING_Y] = `${btnPadY}px`;
  tokens["--ds-btn-size"] = btnSize;
  tokens["--ds-btn-font-size"] = `${btnFontSize}px`;
  tokens[TOKEN_NAMES.BTN_FONT_WEIGHT] = `${btn.fontWeight ?? 500}`;
  tokens[TOKEN_NAMES.BTN_RADIUS] = typeof btn.radius === 'number' ? `${btn.radius}px` : (shapeTokens[`--ds-radius-${btn.radiusLevel || 'md'}`] || "8px");
  tokens[TOKEN_NAMES.BTN_HOVER_LIGHTNESS_DELTA] = `${btn.hover?.lightnessDelta ?? -8}%`;
  tokens[TOKEN_NAMES.BTN_HOVER_COLOR] = btn.hover?.colorOverride || "transparent";
  tokens[TOKEN_NAMES.BTN_HOVER_GLOW] = btn.hover?.glow ? `0 0 12px var(--ds-color-primary-500)` : "none";
  tokens[TOKEN_NAMES.BTN_ACTIVE_LIGHTNESS_DELTA] = `${btn.active?.lightnessDelta ?? -16}%`;
  tokens[TOKEN_NAMES.BTN_RING_WIDTH] = `${btn.focus?.ringWidth ?? 2}px`;
  tokens[TOKEN_NAMES.BTN_RING_OFFSET] = `${btn.focus?.ringOffset ?? 2}px`;
  tokens[TOKEN_NAMES.BTN_RING_COLOR] = colorsTokens["--ds-color-primary-500"] || "#2563eb";
  tokens[TOKEN_NAMES.BTN_DISABLED_OPACITY] = `${btn.disabled?.opacity ?? 0.45}`;

  /* 輸入框 */
  tokens[TOKEN_NAMES.INPUT_PADDING_X] = `${input.paddingX ?? 12}px`;
  tokens[TOKEN_NAMES.INPUT_PADDING_Y] = `${input.paddingY ?? 10}px`;
  tokens[TOKEN_NAMES.INPUT_RADIUS] = typeof input.radius === 'number' ? `${input.radius}px` : (shapeTokens[`--ds-radius-${input.radiusLevel || 'md'}`] || "8px");
  tokens[TOKEN_NAMES.INPUT_HOVER_LIGHTNESS_DELTA] = `${input.hover?.lightnessDelta ?? -4}%`;
  tokens[TOKEN_NAMES.INPUT_HOVER_COLOR] = input.hover?.colorOverride || "transparent";
  tokens[TOKEN_NAMES.INPUT_RING_WIDTH] = `${input.focus?.ringWidth ?? 2}px`;
  tokens[TOKEN_NAMES.INPUT_RING_OFFSET] = `${input.focus?.ringOffset ?? 0}px`;
  tokens[TOKEN_NAMES.INPUT_RING_COLOR] = colorsTokens["--ds-color-primary-500"] || "#2563eb";
  tokens[TOKEN_NAMES.INPUT_DISABLED_OPACITY] = `${input.disabled?.opacity ?? 0.5}`;

  /* 卡片 */
  tokens[TOKEN_NAMES.CARD_PADDING] = `${card.padding ?? 24}px`;
  const cardRad = typeof card.radius === 'number' ? `${card.radius}px` : (shapeTokens[`--ds-radius-${card.radiusLevel || 'lg'}`] || "12px");
  tokens[TOKEN_NAMES.CARD_RADIUS] = cardRad;
  tokens[TOKEN_NAMES.CARD_HOVER_LIGHTNESS_DELTA] = `${card.hover?.lightnessDelta ?? -3}%`;

  /* 子卡片 (Sub-card / Inner Container) */
  const subcard = components.subcard || {};
  const subcardRad = typeof subcard.radius === 'number' ? `${subcard.radius}px` : (shapeTokens[`--ds-radius-${subcard.radiusLevel || 'md'}`] || "8px");
  tokens["--ds-subcard-radius"] = subcardRad;
  const subcardPad = typeof subcard.padding === 'number' ? subcard.padding : 12;
  tokens["--ds-subcard-padding"] = `${subcardPad}px`;

  /* 開關 (Switch) */
  const sw = components.switch || {};
  const isSmSwitch = sw.size === "sm";
  tokens["--ds-switch-width"] = isSmSwitch ? "36px" : "44px";
  tokens["--ds-switch-height"] = isSmSwitch ? "20px" : "24px";
  tokens["--ds-switch-knob-size"] = isSmSwitch ? "16px" : "20px";
  tokens["--ds-switch-knob-travel"] = isSmSwitch ? "16px" : "20px";
  tokens["--ds-switch-border"] = sw.trackBorder !== false ? "1px solid var(--ds-surface-text-muted, #a1a1aa)" : "none";

  /* 分段控制器 / 分頁 (Tabs) */
  const cardPad = typeof card.padding === 'number' ? card.padding : 16;
  tokens["--ds-card-padding"] = `${cardPad}px`;

  const tabs = components.tabs || {};
  tokens["--ds-tabs-style"] = tabs.style || "segmented";
  tokens["--ds-tabs-radius"] = shapeTokens[`--ds-radius-${tabs.radiusLevel || 'md'}`] || "8px";

  /* 核取方塊與單選框 (Checkbox & Radio) */
  const cr = components.checkboxRadio || {};
  const isSmCheck = cr.size === "sm";
  tokens["--ds-check-size"] = isSmCheck ? "16px" : "20px";
  const checkRadLvl = cr.radiusLevel || "sm";
  tokens["--ds-check-radius"] = typeof cr.radius === 'number' ? `${cr.radius}px` : (checkRadLvl === "none" ? "0px" : (shapeTokens[`--ds-radius-${checkRadLvl}`] || "4px"));

  lastComponentsInput = components;
  lastComponentsColorsRef = colorsTokens;
  cachedComponentsTokens = tokens;
  return tokens;
}

/* 主推導入口 */
export function deriveTokens(state) {
  const { tokens: colorTokens, ramps } = deriveColors(state.colors, state.meta.previewMode);
  const typeTokens = deriveTypography(state.typography);
  const shapeTokens = deriveShape(state.shape);
  const primaryColor = colorTokens["--ds-color-primary-500"] || "#0284c7";
  const primary900 = colorTokens["--ds-color-primary-900"] || "#001f33";
  const elevationTokens = deriveElevation(state.elevation, primaryColor, primary900);
  const componentTokens = deriveComponents(state.components || {}, shapeTokens, colorTokens);

  const tokenMap = {
    ...colorTokens,
    ...typeTokens,
    ...shapeTokens,
    ...elevationTokens,
    ...componentTokens
  };

  return {
    tokenMap,
    ramps
  };
}
