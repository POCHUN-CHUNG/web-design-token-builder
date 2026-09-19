// Build Your Design Systems - Standalone Bundle for file:/// compatibility
(function() {
  const modules = {};
  const cache = {};

  function define(id, factory) {
    modules[id] = factory;
  }

  function resolve(currentPath, relPath) {
    if (!relPath.startsWith(".")) return relPath;
    const parts = currentPath.split("/").slice(0, -1);
    const segs = relPath.split("/");
    for (const seg of segs) {
      if (seg === ".") continue;
      if (seg === "..") parts.pop();
      else parts.push(seg);
    }
    let res = parts.join("/");
    if (!res.endsWith(".js")) res += ".js";
    return res;
  }

  function requireModule(currentPath, relPath) {
    const resolved = resolve(currentPath, relPath);
    if (cache[resolved]) return cache[resolved];
    if (!modules[resolved]) {
      throw new Error("Module not found: " + resolved + " (required from " + currentPath + ")");
    }
    const exports = {};
    cache[resolved] = exports;
    modules[resolved]((p) => requireModule(resolved, p), exports);
    return exports;
  }

  define("./src/a11y/audit.js", function(__require, exports) {
const { contrastRatio, pickOnColor, autoFix } = __require("../color/contrast.js");
const { buildRamp } = __require("../color/ramp.js");
const { deriveSurfaceColors } = __require("../tokens/derive.js");

exports.runA11yAudit = runA11yAudit; function runA11yAudit(state, targetMode = null) {
  const results = [];

  /* 輔助檢查單一配對 (AA 門檻與 AAA 門檻) */
  function checkPair(name, fgHex, bgHex, aaThreshold, aaaThreshold, mode, type = "normal") {
    const ratio = contrastRatio(fgHex, bgHex);
    const passAA = ratio >= aaThreshold;
    const passAAA = ratio >= aaaThreshold;
    results.push({
      name,
      fg: fgHex,
      bg: bgHex,
      ratio: Math.round(ratio * 100) / 100,
      threshold: aaThreshold,
      aaThreshold,
      aaaThreshold,
      mode,
      type,
      pass: passAA,
      passAA,
      passAAA
    });
  }

  /* 依序檢查指定的模式（若無指定則同時檢查 light 與 dark） */
  const modes = targetMode ? [targetMode] : ["light", "dark"];

  for (const mode of modes) {
    const currentColors = state.colors[mode];
    if (!currentColors) continue;

    const neutralRamp = buildRamp(currentColors.neutral.seed, true);
    const surfaces = deriveSurfaceColors(neutralRamp, currentColors.surface, mode);

    /* 1. 一般主要文字 text / bg (AA 4.5:1, AAA 7.0:1) */
    checkPair("text / bg", surfaces.text, surfaces.bg, 4.5, 7.0, mode, "text");

    /* 2. 一般主要文字 text / surface (AA 4.5:1, AAA 7.0:1) */
    checkPair("text / surface", surfaces.text, surfaces.surface, 4.5, 7.0, mode, "text");

    /* 3. 次要文字 text-muted / bg (AA 4.5:1, AAA 4.5:1) */
    checkPair("text-muted / bg", surfaces.textMuted, surfaces.bg, 4.5, 4.5, mode, "text");

    /* 4. 次要文字 text-muted / surface (AA 4.5:1, AAA 4.5:1) */
    checkPair("text-muted / surface", surfaces.textMuted, surfaces.surface, 4.5, 4.5, mode, "text");

    /* 5. 按鈕主要文字 on-primary / primary.500 (AA 4.5:1, AAA 7.0:1) */
    if (currentColors.primaries && currentColors.primaries.length > 0) {
      const primaryRamp = buildRamp(currentColors.primaries[0].seed, false);
      const onPrimary = pickOnColor(primaryRamp[5], primaryRamp, 4.5);
      checkPair("on-primary / primary.500", onPrimary, primaryRamp[5], 4.5, 7.0, mode, "text");
    }

    /* 6. 強邊框 border-strong / bg (AA 3.0:1, AAA 3.0:1) */
    checkPair("border-strong / bg", surfaces.borderStrong, surfaces.bg, 3.0, 3.0, mode, "non-text");

    /* 7. 焦點環 primary.500 / bg (AA 3.0:1, AAA 4.5:1) */
    if (currentColors.primaries && currentColors.primaries.length > 0) {
      const primary500 = buildRamp(currentColors.primaries[0].seed, false)[5];
      checkPair("primary.500 / bg", primary500, surfaces.bg, 3.0, 4.5, mode, "non-text");
    }

    /* 8-11. 各語意色 semantic.* / bg (AA 3.0:1, AAA 4.5:1) */
    if (currentColors.semantic) {
      for (const [key, seed] of Object.entries(currentColors.semantic)) {
        checkPair(`semantic.${key} / bg`, seed, surfaces.bg, 3.0, 4.5, mode, "non-text");
      }
    }

    /* 12+. 各輔助色 accent-n.500 / bg (AA 3.0:1, AAA 4.5:1) */
    if (currentColors.accents) {
      for (const accent of currentColors.accents) {
        const accent500 = buildRamp(accent.seed, false)[5];
        checkPair(`accent.${accent.id}.500 / bg`, accent500, surfaces.bg, 3.0, 4.5, mode, "non-text");
      }
    }
  }

  const failCount = results.filter(r => !r.passAA).length;
  const pass = failCount === 0;
  const allPassAAA = results.every(r => r.passAAA);

  let level = "fail";
  if (allPassAAA) {
    level = "AAA";
  } else if (pass) {
    level = "AA";
  }

  return {
    pass,
    level, /* "AAA" | "AA" | "fail" */
    failCount,
    results
  };
}

exports.fixA11yIssues = fixA11yIssues; function fixA11yIssues(state) {
  const audit = runA11yAudit(state);
  if (audit.pass) return state;

  const nextColors = JSON.parse(JSON.stringify(state.colors));

  for (const item of audit.results) {
    if (item.pass) continue;
    const mode = item.mode;
    const currentColors = nextColors[mode];
    if (!currentColors) continue;

    if (item.name.startsWith("semantic.")) {
      const key = item.name.split(" / ")[0].replace("semantic.", "").trim();
      if (currentColors.semantic && currentColors.semantic[key]) {
        currentColors.semantic[key] = autoFix(currentColors.semantic[key], item.bg, item.threshold);
      }
    } else if (item.name.startsWith("accent.")) {
      const parts = item.name.split(" / ")[0].split(".");
      const id = parts[1];
      const acc = currentColors.accents?.find(a => a.id === id);
      if (acc) {
        acc.seed = autoFix(acc.seed, item.bg, item.threshold);
      }
    } else if (item.name.includes("primary")) {
      if (currentColors.primaries && currentColors.primaries[0]) {
        currentColors.primaries[0].seed = autoFix(currentColors.primaries[0].seed, item.bg, item.threshold);
      }
    }
  }

  return {
    ...state,
    colors: nextColors
  };
}


  });

  define("./src/color/contrast.js", function(__require, exports) {
/**
 * WCAG 相對亮度、對比度計算與自適應對比調整（純函式，零 DOM 依賴）
 * 完全遵循 SPEC 第 6.7、7.1、7.2、7.5 與 7.9 節
 */
const { hexToSrgb01, hexToOklch, oklchToHex, clamp01 } = __require("./convert.js");
const { gamutMap } = __require("./gamut.js");

/* WCAG 2.x 相對亮度（嚴格使用 0.03928 門檻） */
exports.relativeLuminance = relativeLuminance; function relativeLuminance(hex) {
  const [r, g, b] = hexToSrgb01(hex).map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* WCAG 對比度比值（1.0 ~ 21.0） */
exports.contrastRatio = contrastRatio; function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

/* 挑選最佳的前景字色：優先色調端點（950, 50），保底純白/純黑（√21 定理） */
exports.pickOnColor = pickOnColor; function pickOnColor(bgHex, ramp, threshold = 4.5) {
  if (ramp && ramp.length === 11) {
    const tinted = [ramp[10] /* 950 */, ramp[0] /* 50 */];
    for (const c of tinted) {
      if (contrastRatio(c, bgHex) >= threshold) {
        return c;
      }
    }
  }
  /* 保底候選必須是純白或純黑（最壞情況 √21 ≈ 4.5826 > 4.5） */
  return contrastRatio("#ffffff", bgHex) >= contrastRatio("#000000", bgHex)
    ? "#ffffff"
    : "#000000";
}

/* 兩 hex 間的 OKLCH L 差距 */
exports.shiftOf = shiftOf; function shiftOf(hexA, hexB) {
  return Math.abs(hexToOklch(hexA).L - hexToOklch(hexB).L);
}

/* text-muted 自適應推導：往背景靠攏，逼近下限但仍高於 threshold */
exports.weakenToLimit = weakenToLimit; function weakenToLimit(baseHex, bgHex, threshold = 4.5, maxShift = 0.30) {
  const { L, C, H } = hexToOklch(baseHex);
  const bgL = hexToOklch(bgHex).L;
  const dir = bgL > L ? 1 : -1; /* 往背景方向 */
  let best = baseHex;

  for (let shift = 0.005; shift <= maxShift; shift += 0.005) {
    const cand = oklchToHex(gamutMap(clamp01(L + dir * shift), C, H));
    if (contrastRatio(cand, bgHex) >= threshold) {
      best = cand;
    } else {
      break; /* 對比度單調遞減，一旦不足即停止 */
    }
  }
  return best;
}

/* border-strong 與 autoFix 自適應推導：雙向搜尋，遠離背景直到達標即停，取最小改動量 */
exports.strengthenToMeet = strengthenToMeet; function strengthenToMeet(baseHex, bgHex, threshold = 3.0, maxShift = 1.0) {
  const { L, C, H } = hexToOklch(baseHex);
  let best = null;

  for (const dir of [-1, 1]) { /* 正反雙向搜尋 */
    for (let shift = 0; shift <= maxShift; shift += 0.005) {
      const cand = oklchToHex(gamutMap(clamp01(L + dir * shift), C, H));
      if (contrastRatio(cand, bgHex) >= threshold) {
        if (!best || shift < best.shift) {
          best = { shift, cand };
        }
        break; /* 該方向已達標，跳至下個方向 */
      }
    }
  }

  if (best) return best.cand;

  /* 保底：純白或純黑 */
  return contrastRatio("#ffffff", bgHex) >= contrastRatio("#000000", bgHex)
    ? "#ffffff"
    : "#000000";
}

/* SPEC 7.9: autoFix 與 strengthenToMeet 為同一個演算法，共用實作 */
const autoFix = exports.autoFix = strengthenToMeet;

  });

  define("./src/color/convert.js", function(__require, exports) {
/**
 * sRGB ↔ OKLab ↔ OKLCH 雙向精準色彩轉換模組（純函式，零 DOM 依賴）
 * 完全遵循 SPEC 第 6.2 與 6.3 節
 */

exports.clamp01 = clamp01; function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/* hex (例如 "#2563eb") → [r, g, b] (0~1) */
exports.hexToSrgb01 = hexToSrgb01; function hexToSrgb01(hex) {
  let clean = hex.replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean.split("").map(ch => ch + ch).join("");
  }
  const num = parseInt(clean, 16);
  const r = ((num >> 16) & 255) / 255;
  const g = ((num >> 8) & 255) / 255;
  const b = (num & 255) / 255;
  return [r, g, b];
}

/* sRGB → 線性 RGB（反伽瑪） */
exports.srgbToLinear = srgbToLinear; function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/* 線性 RGB → sRGB（伽瑪） */
exports.linearToSrgb = linearToSrgb; function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/* 線性 RGB → OKLab */
exports.linearRgbToOklab = linearRgbToOklab; function linearRgbToOklab(r, g, b) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L =  0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a =  1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const bLab =  0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  return [L, a, bLab];
}

/* OKLab → 線性 RGB */
exports.oklabToLinearRgb = oklabToLinearRgb; function oklabToLinearRgb(L, a, bLab) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * bLab;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bLab;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * bLab;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return [r, g, b];
}

/* OKLab → OKLCH */
exports.oklabToOklch = oklabToOklch; function oklabToOklch(L, a, bLab) {
  const C = Math.hypot(a, bLab);
  let H = (Math.atan2(bLab, a) * 180 / Math.PI + 360) % 360;
  if (isNaN(H)) H = 0;
  return { L, C, H };
}

/* OKLCH → OKLab */
exports.oklchToOklab = oklchToOklab; function oklchToOklab(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const bLab = C * Math.sin(hRad);
  return [L, a, bLab];
}

/* hex → OKLCH */
exports.hexToOklch = hexToOklch; function hexToOklch(hex) {
  const [r, g, b] = hexToSrgb01(hex);
  const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  const [L, a, bLab] = linearRgbToOklab(lr, lg, lb);
  return oklabToOklch(L, a, bLab);
}

/* OKLCH → hex (小寫 6 位 hex) */
exports.oklchToHex = oklchToHex; function oklchToHex({ L, C, H }) {
  const [a, bLab] = [
    C * Math.cos((H * Math.PI) / 180),
    C * Math.sin((H * Math.PI) / 180)
  ];
  const [lr, lg, lb] = oklabToLinearRgb(L, a, bLab);
  const r = Math.round(clamp01(linearToSrgb(lr)) * 255);
  const g = Math.round(clamp01(linearToSrgb(lg)) * 255);
  const b = Math.round(clamp01(linearToSrgb(lb)) * 255);

  const rh = r.toString(16).padStart(2, "0");
  const gh = g.toString(16).padStart(2, "0");
  const bh = b.toString(16).padStart(2, "0");
  return `#${rh}${gh}${bh}`;
}

  });

  define("./src/color/gamut.js", function(__require, exports) {
/**
 * sRGB 色域映射（純函式，零 DOM 依賴）
 * 固定 L 與 H，二分搜尋降低 C 直到落回色域內（完全遵循 SPEC 第 6.4 節）
 */
const { oklabToLinearRgb } = __require("./convert.js");

exports.inGamut = inGamut; function inGamut(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const bLab = C * Math.sin((H * Math.PI) / 180);
  const [lr, lg, lb] = oklabToLinearRgb(L, a, bLab);
  const eps = 1e-6;
  return (
    lr >= -eps && lr <= 1 + eps &&
    lg >= -eps && lg <= 1 + eps &&
    lb >= -eps && lb <= 1 + eps
  );
}

exports.gamutMap = gamutMap; function gamutMap(L, C, H) {
  if (inGamut(L, C, H)) return { L, C, H };
  let lo = 0;
  let hi = C;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(L, mid, H)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { L, C: lo, H };
}

  });

  define("./src/color/ramp.js", function(__require, exports) {
/**
 * 11 階色階生成模組（純函式，零 DOM 依賴）
 * 實作自適應端點與錨定重映射（完全遵循 SPEC 第 6.5 節）
 */
const { hexToOklch, oklchToHex } = __require("./convert.js");
const { gamutMap } = __require("./gamut.js");

const RAMP_STEPS = exports.RAMP_STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const BASE_L = exports.BASE_L = [0.971, 0.936, 0.885, 0.808, 0.714, 0.624, 0.541, 0.462, 0.382, 0.295, 0.223];
const ANCHOR = exports.ANCHOR = 5; /* 索引 5 = 500 階 */
const L_HI = exports.L_HI = 0.980; /* 50 階的標準亮度上限 */
const L_LO = exports.L_LO = 0.150; /* 950 階的標準亮度下限 */
const MIN_GAP = exports.MIN_GAP = 0.012; /* 相鄰階層的最小 L 間隔 */

/* 自適應端點：確保極端種子色不會發生色階塌陷與逆序 */
exports.endpoints = endpoints; function endpoints(Lseed) {
  return {
    hi: Math.min(1.0, Math.max(L_HI, Lseed + 5 * MIN_GAP)),
    lo: Math.max(0.0, Math.min(L_LO, Lseed - 5 * MIN_GAP)),
  };
}

/* 亮度重映射：保留曲線形狀並釘牢 500 階錨點 */
exports.remapL = remapL; function remapL(Lseed) {
  const { hi, lo } = endpoints(Lseed);
  return BASE_L.map((L, i) => {
    if (i === ANCHOR) return Lseed;
    if (i < ANCHOR) {
      const t = (BASE_L[i] - BASE_L[ANCHOR]) / (BASE_L[0] - BASE_L[ANCHOR]);
      return Lseed + t * (hi - Lseed);
    }
    const t = (BASE_L[ANCHOR] - BASE_L[i]) / (BASE_L[ANCHOR] - BASE_L[10]);
    return Lseed - t * (Lseed - lo);
  });
}

/* 鐘形彩度曲線 */
const taper = exports.taper = (L) => 1 - Math.pow(Math.abs(2 * L - 1), 2.2);

/* 生成 11 階色階陣列 */
exports.buildRamp = buildRamp; function buildRamp(seedHex, isNeutral = false) {
  let { L: Ls, C: Cs, H } = hexToOklch(seedHex);

  if (isNeutral) {
    Cs = Cs < 0.004 ? 0 : Cs * 0.35; /* 中性色彩度調和 */
  }

  const targets = remapL(Ls);
  const taperSeed = taper(Ls);

  return targets.map((L, i) => {
    if (i === ANCHOR && !isNeutral) {
      return seedHex.toLowerCase(); /* 種子色 100% 原樣保留在 500 階 */
    }
    const C = taperSeed > 1e-6 ? (Cs * taper(L)) / taperSeed : 0;
    return oklchToHex(gamutMap(L, C, H));
  });
}

  });

  define("./src/config.js", function(__require, exports) {
/* 應用程式全域常數與設定 */
const APP_ORIGIN = exports.APP_ORIGIN = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://localhost';
const STORAGE_KEY = exports.STORAGE_KEY = 'byds:state:v6';
const SCHEMA_VERSION = exports.SCHEMA_VERSION = 5;

  });

  define("./src/core/actions.js", function(__require, exports) {
/* Action 常數與 Action 建構函式（完全遵循 SPEC 第 5.3 節） */
const ACTIONS = exports.ACTIONS = {
  APPLY_PRESET: "APPLY_PRESET",
  SET_LOCALE: "SET_LOCALE",
  SET_PREVIEW_MODE: "SET_PREVIEW_MODE",
  SET_TAB: "SET_TAB",
  SET_PANEL_OPEN: "SET_PANEL_OPEN",
  SET_PANEL_COMPLETED: "SET_PANEL_COMPLETED",
  SET_LEFT_WIDTH: "SET_LEFT_WIDTH",
  PATCH: "PATCH",
  ADD_COLOR: "ADD_COLOR",
  REMOVE_COLOR: "REMOVE_COLOR",
  ADD_GUIDELINE: "ADD_GUIDELINE",
  REMOVE_GUIDELINE: "REMOVE_GUIDELINE",
  SET_TYPE_OVERRIDE: "SET_TYPE_OVERRIDE",
  CLEAR_TYPE_OVERRIDE: "CLEAR_TYPE_OVERRIDE",
  RESET_ALL: "RESET_ALL",
  HYDRATE: "HYDRATE"
};

const applyPreset = exports.applyPreset = (presetId, presetState) => ({
  type: ACTIONS.APPLY_PRESET,
  payload: { presetId, presetState }
});

const setLocale = exports.setLocale = (locale) => ({
  type: ACTIONS.SET_LOCALE,
  payload: { locale }
});

const setPreviewMode = exports.setPreviewMode = (mode) => ({
  type: ACTIONS.SET_PREVIEW_MODE,
  payload: { mode }
});

const setTab = exports.setTab = (tab) => ({
  type: ACTIONS.SET_TAB,
  payload: { tab }
});

const setPanelOpen = exports.setPanelOpen = (panel, open) => ({
  type: ACTIONS.SET_PANEL_OPEN,
  payload: { panel, open }
});

const setPanelCompleted = exports.setPanelCompleted = (panel, completed) => ({
  type: ACTIONS.SET_PANEL_COMPLETED,
  payload: { panel, completed }
});

const setLeftWidth = exports.setLeftWidth = (width) => ({
  type: ACTIONS.SET_LEFT_WIDTH,
  payload: { width }
});

const patch = exports.patch = (path, value) => ({
  type: ACTIONS.PATCH,
  payload: { path, value }
});

const addColor = exports.addColor = (group) => ({
  type: ACTIONS.ADD_COLOR,
  payload: { group }
});

const removeColor = exports.removeColor = (group, id) => ({
  type: ACTIONS.REMOVE_COLOR,
  payload: { group, id }
});

const addGuideline = exports.addGuideline = (kind) => ({
  type: ACTIONS.ADD_GUIDELINE,
  payload: { kind }
});

const removeGuideline = exports.removeGuideline = (kind, index) => ({
  type: ACTIONS.REMOVE_GUIDELINE,
  payload: { kind, index }
});

const setTypeOverride = exports.setTypeOverride = (step, prop, value) => ({
  type: ACTIONS.SET_TYPE_OVERRIDE,
  payload: { step, prop, value }
});

const clearTypeOverride = exports.clearTypeOverride = (step) => ({
  type: ACTIONS.CLEAR_TYPE_OVERRIDE,
  payload: { step }
});

const resetAll = exports.resetAll = () => ({
  type: ACTIONS.RESET_ALL,
  payload: {}
});

const hydrate = exports.hydrate = (state) => ({
  type: ACTIONS.HYDRATE,
  payload: { state }
});

  });

  define("./src/core/defaultState.js", function(__require, exports) {
/* 系統初始狀態定義（完全遵循 SPEC 第 5.1 節與參數化旋鈕架構） */
const defaultState = exports.defaultState = {
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

  });

  define("./src/core/reducer.js", function(__require, exports) {
/* 純函式 reducer，處理所有 Action（完全遵循 SPEC 第 5.3 節） */
const { ACTIONS } = __require("./actions.js");
const { defaultState } = __require("./defaultState.js");

/* 深拷貝物件輔助函式 */
function deepClone(obj) {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

/* 不可變路徑更新函式：依據點記法路徑沿途淺複製並設值 */
function setIn(obj, pathParts, value) {
  if (pathParts.length === 0) return value;
  const [head, ...tail] = pathParts;
  const current = obj && typeof obj === "object" ? obj : {};
  return {
    ...current,
    [head]: setIn(current[head], tail, value)
  };
}

exports.reducer = reducer; function reducer(state = defaultState, action) {
  if (!action || !action.type) return state;

  switch (action.type) {
    case ACTIONS.APPLY_PRESET: {
      const { presetId, presetState } = action.payload;
      if (!presetState) return state;
      /* 保留當前的 meta.locale 與整個 ui 狀態 */
      const nextState = deepClone(presetState);
      return {
        ...nextState,
        meta: {
          ...nextState.meta,
          presetId: presetId || "custom",
          locale: state.meta.locale,
          previewMode: state.meta.previewMode,
          contentLanguage: nextState.meta.contentLanguage || state.meta.contentLanguage
        },
        ui: {
          ...state.ui
        }
      };
    }

    case ACTIONS.SET_LOCALE: {
      return {
        ...state,
        meta: {
          ...state.meta,
          locale: action.payload.locale
        }
      };
    }

    case ACTIONS.SET_PREVIEW_MODE: {
      return {
        ...state,
        meta: {
          ...state.meta,
          previewMode: action.payload.mode
        }
      };
    }

    case ACTIONS.SET_TAB: {
      return {
        ...state,
        ui: {
          ...state.ui,
          activeTab: action.payload.tab
        }
      };
    }

    case ACTIONS.SET_PANEL_OPEN: {
      const { panel, open } = action.payload;
      const current = state.ui?.panels?.[panel] || { open: false, completed: false };
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [panel]: {
              ...current,
              open
            }
          }
        }
      };
    }

    case ACTIONS.SET_PANEL_COMPLETED: {
      const { panel, completed } = action.payload;
      const current = state.ui?.panels?.[panel] || { open: false, completed: false };
      /* SPEC 9.3.2: 點「完成」→ 自動收合；點「編輯」→ 自動展開 */
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [panel]: {
              ...current,
              completed,
              open: !completed
            }
          }
        }
      };
    }

    case ACTIONS.SET_LEFT_WIDTH: {
      const clamped = Math.max(250, Math.min(560, Math.round(action.payload.width)));
      return {
        ...state,
        ui: {
          ...state.ui,
          leftPanelWidth: clamped
        }
      };
    }

    case ACTIONS.PATCH: {
      const { path, value } = action.payload;
      if (!path) return state;
      const parts = path.split(".");
      let nextState = setIn(state, parts, value);

      /* 若修改的是設計 token 參數（非 meta / ui），將 presetId 標記為 custom */
      if (parts[0] !== "ui" && parts[0] !== "meta") {
        if (nextState.meta.presetId !== "custom") {
          nextState = {
            ...nextState,
            meta: {
              ...nextState.meta,
              presetId: "custom"
            }
          };
        }
      }
      return nextState;
    }

    case ACTIONS.ADD_COLOR: {
      const { group } = action.payload;

      if (group === "primaries") {
        if (state.colors.light.primaries.length >= 3) return state;
        
        const existingIds = state.colors.light.primaries.map(c => c.id);
        const candidates = ["primary", "secondary", "tertiary"];
        let id = candidates.find(c => !existingIds.includes(c));
        if (!id) id = `primary-${Date.now()}`;

        return {
          ...state,
          meta: { ...state.meta, presetId: "custom" },
          colors: {
            ...state.colors,
            light: {
              ...state.colors.light,
              primaries: [...state.colors.light.primaries, { id, seed: "#000000" }]
            },
            dark: {
              ...state.colors.dark,
              primaries: [...state.colors.dark.primaries, { id, seed: "#FFFFFF" }]
            }
          }
        };
      } else if (group === "accents") {
        if (state.colors.light.accents.length >= 6) return state;
        const id = `accent-${Date.now()}`;
        return {
          ...state,
          meta: { ...state.meta, presetId: "custom" },
          colors: {
            ...state.colors,
            light: {
              ...state.colors.light,
              accents: [...state.colors.light.accents, { id, seed: "#000000" }]
            },
            dark: {
              ...state.colors.dark,
              accents: [...state.colors.dark.accents, { id, seed: "#FFFFFF" }]
            }
          }
        };
      }
      return state;
    }

    case ACTIONS.REMOVE_COLOR: {
      const { group, id } = action.payload;
      if (group === "primaries") {
        if (state.colors.light.primaries.length <= 1) return state;
        return {
          ...state,
          meta: { ...state.meta, presetId: "custom" },
          colors: {
            ...state.colors,
            light: {
              ...state.colors.light,
              primaries: state.colors.light.primaries.filter(c => c.id !== id)
            },
            dark: {
              ...state.colors.dark,
              primaries: state.colors.dark.primaries.filter(c => c.id !== id)
            }
          }
        };
      } else if (group === "accents") {
        return {
          ...state,
          meta: { ...state.meta, presetId: "custom" },
          colors: {
            ...state.colors,
            light: {
              ...state.colors.light,
              accents: state.colors.light.accents.filter(c => c.id !== id)
            },
            dark: {
              ...state.colors.dark,
              accents: state.colors.dark.accents.filter(c => c.id !== id)
            }
          }
        };
      }
      return state;
    }

    case ACTIONS.SET_TYPE_OVERRIDE: {
      const { step, prop, value } = action.payload;
      const currentOverrides = state.typography.overrides || {};
      const currentStep = currentOverrides[step] || {};
      return {
        ...state,
        meta: { ...state.meta, presetId: "custom" },
        typography: {
          ...state.typography,
          overrides: {
            ...currentOverrides,
            [step]: {
              ...currentStep,
              [prop]: value
            }
          }
        }
      };
    }

    case ACTIONS.CLEAR_TYPE_OVERRIDE: {
      const { step } = action.payload;
      const currentOverrides = { ...(state.typography.overrides || {}) };
      delete currentOverrides[step];
      return {
        ...state,
        meta: { ...state.meta, presetId: "custom" },
        typography: {
          ...state.typography,
          overrides: currentOverrides
        }
      };
    }

    case ACTIONS.RESET_ALL: {
      const fresh = deepClone(defaultState);
      return {
        ...fresh,
        meta: {
          ...fresh.meta,
          locale: state.meta.locale
        },
        ui: {
          ...fresh.ui,
          leftPanelWidth: state.ui.leftPanelWidth
        }
      };
    }

    case ACTIONS.HYDRATE: {
      const incoming = action.payload.state;
      if (!incoming) return state;
      /* 確保結構完整，合併 defaultState */
      return {
        ...defaultState,
        ...incoming,
        meta: {
          ...defaultState.meta,
          ...incoming.meta,
          /* 保留現有語言如果使用者沒在 hash 指定 */
          locale: incoming.meta?.locale || state.meta.locale
        },
        ui: {
          ...defaultState.ui,
          ...incoming.ui,
          /* 保留本機面板寬度 */
          leftPanelWidth: state.ui.leftPanelWidth
        }
      };
    }

    default:
      return state;
  }
}

  });

  define("./src/core/schedule.js", function(__require, exports) {
/* 排程與節流工具（完全遵循 SPEC 第 3.1 & 3.2 節） */

/* requestAnimationFrame 合併排程器 */
exports.createRafBatcher = createRafBatcher; function createRafBatcher(fn) {
  let scheduled = false;
  let lastArgs = null;

  return function (...args) {
    lastArgs = args;
    if (!scheduled) {
      scheduled = true;
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => {
          scheduled = false;
          fn(...lastArgs);
        });
      } else {
        setTimeout(() => {
          scheduled = false;
          fn(...lastArgs);
        }, 16);
      }
    }
  };
}

/* 防抖函式 (Debounce) */
exports.debounce = debounce; function debounce(fn, wait) {
  let timeoutId = null;
  return function (...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(this, args);
    }, wait);
  };
}

/* 節流函式 (Throttle) */
exports.throttle = throttle; function throttle(fn, limit) {
  let inThrottle = false;
  let lastArgs = null;
  let lastContext = null;

  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn.apply(lastContext, lastArgs);
          lastArgs = null;
          lastContext = null;
        }
      }, limit);
    } else {
      lastArgs = args;
      lastContext = this;
    }
  };
}

/* requestIdleCallback 降級包裝 */
exports.scheduleIdle = scheduleIdle; function scheduleIdle(fn) {
  if (typeof requestIdleCallback !== "undefined") {
    return requestIdleCallback(fn);
  }
  return setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 10 }), 1);
}

  });

  define("./src/core/store.js", function(__require, exports) {
/* 集中式狀態 Store 實作（完全遵循 SPEC 第 4 節 & 第 3.3 節） */
exports.createStore = createStore; function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = new Set();
  let isDispatching = false;

  function getState() {
    return state;
  }

  function dispatch(action) {
    if (typeof action !== "object" || action === null || typeof action.type === "undefined") {
      throw new Error("Actions must be plain objects with a type property.");
    }
    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions.");
    }

    try {
      isDispatching = true;
      state = reducer(state, action);
    } finally {
      isDispatching = false;
    }

    listeners.forEach(listener => {
      try {
        listener(state, action);
      } catch (err) {
        console.error("Error in store listener:", err);
      }
    });

    return action;
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error("Expected the listener to be a function.");
    }
    listeners.add(listener);
    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  return {
    getState,
    dispatch,
    subscribe
  };
}

  });

  define("./src/data/googleFontsData.js", function(__require, exports) {
const GOOGLE_FONTS_DATA = exports.GOOGLE_FONTS_DATA = {"allFonts":["ABeeZee","Abel","Abhaya Libre","Aboreto","Abril Fatface","Abyssinica SIL","Aclonica","Acme","Actor","Adamina","ADLaM Display","Advent Pro","Afacad","Afacad Flux","Agbalumo","Agdasima","Agu Display","Aguafina Script","Akatab","Akaya Kanadaka","Akaya Telivigala","Akronim","Akshar","Akt","Aladin","Alan Sans","Alata","Alatsi","Albert Sans","Aldrich","Alef","Alegreya","Alegreya Sans","Alegreya Sans SC","Alegreya SC","Aleo","Alex Brush","Alexandria","Alfa Slab One","Alice","Alien Block","Alike","Alike Angular","Alkalami","Alkatra","Allan","Allerta","Allerta Stencil","Allison","Allkin","Allura","Almarai","Almendra","Almendra Display","Almendra SC","Alumni Sans","Alumni Sans Collegiate One","Alumni Sans Inline One","Alumni Sans Pinstripe","Alumni Sans SC","Alyamama","Amarante","Amaranth","Amarna","Amatic SC","Amethysta","Amiko","Amiri","Amiri Quran","Amita","Anaheim","Ancizar Sans","Ancizar Serif","Andada Pro","Andika","Anek Bangla","Anek Devanagari","Anek Gujarati","Anek Gurmukhi","Anek Kannada","Anek Latin","Anek Malayalam","Anek Odia","Anek Tamil","Anek Telugu","Angkor","Annapurna SIL","Annie Use Your Telescope","Anonymous Pro","Anta","Antic","Antic Didone","Antic Slab","Anton","Anton SC","Antonio","Anuphan","Anybody","Aoboshi One","AR One Sans","Arapey","Arbutus","Arbutus Slab","Architects Daughter","Archivo","Archivo Black","Archivo Narrow","Are You Serious","Aref Ruqaa","Aref Ruqaa Ink","Arima","Arimo","Arizonia","Armata","Arsenal","Arsenal SC","Artifika","Arvo","Arya","Asap","Asap Condensed","Asap Sharp","Asar","Asimovian","Asset","Assistant","Asta Sans","Astloch","Asul","Athiti","Atkinson Hyperlegible","Atkinson Hyperlegible Mono","Atkinson Hyperlegible Next","Atma","Atomic Age","Aubrey","Audiowide","Autour One","Average","Average Sans","Averia Gruesa Libre","Averia Libre","Averia Sans Libre","Averia Serif Libre","Azeret Mono","B612","B612 Mono","Babylonica","Bacasime Antique","Bad Script","Badeen Display","Bagel Fat One","Bahiana","Bahianita","Bai Jamjuree","Bakbak One","Ballet","Baloo 2","Baloo Bhai 2","Baloo Bhaijaan 2","Baloo Bhaina 2","Baloo Chettan 2","Baloo Da 2","Baloo Paaji 2","Baloo Tamma 2","Baloo Tammudu 2","Baloo Thambi 2","Balsamiq Sans","Balthazar","Bangers","Barlow","Barlow Condensed","Barlow Semi Condensed","Barriecito","Barrio","Basic","Baskervville","Baskervville SC","Battambang","Baumans","Bayon","BBH Bartle","BBH Bogle","BBH Hegarty","Be Vietnam Pro","Beau Rivage","Bebas Neue","Beiruti","Belanosima","Belgrano","Bellefair","Belleza","Bellota","Bellota Text","BenchNine","Benne","Bentham","Berkshire Swash","Besley","Betania Patmos","Betania Patmos GDL","Betania Patmos In","Betania Patmos In GDL","Beth Ellen","Bevan","BhuTuka Expanded One","Big Shoulders","Big Shoulders Inline","Big Shoulders Stencil","Bigelow Rules","Bigshot One","Bilbo","Bilbo Swash Caps","BioRhyme","BioRhyme Expanded","Birthstone","Birthstone Bounce","Biryani","Bitcount","Bitcount Grid Double","Bitcount Grid Double Ink","Bitcount Grid Single","Bitcount Grid Single Ink","Bitcount Ink","Bitcount Prop Double","Bitcount Prop Double Ink","Bitcount Prop Single","Bitcount Prop Single Ink","Bitcount Single","Bitcount Single Ink","Bitter","BIZ UDGothic","BIZ UDMincho","BIZ UDPGothic","BIZ UDPMincho","BJCree","Black And White Picture","Black Han Sans","Black Ops One","Blaka","Blaka Hollow","Blaka Ink","Blinker","Bodoni Moda","Bodoni Moda SC","Bokor","Boldonse","Bona Nova","Bona Nova SC","Bonbon","Bonheur Royale","Boogaloo","Borel","Bowlby One","Bowlby One SC","Bpmf Huninn","Bpmf Iansui","Bpmf Zihi Kai Std","Braah One","Brawler","Bree Serif","Bricolage Grotesque","Bruno Ace","Bruno Ace SC","Brygada 1918","Bubblegum Sans","Bubbler One","Buda","Buenard","Bungee","Bungee Hairline","Bungee Inline","Bungee Outline","Bungee Shade","Bungee Spice","Bungee Tint","Butcherman","Butterfly Kids","Bytesized","Caacupe One","Cabin","Cabin Condensed","Cabin Sketch","Cactus Classical Serif","Caesar Dressing","Cagliostro","Cairo","Cairo Play","Cal Sans","Caladea","Calistoga","Calligraffitti","Cambay","Cambo","Candal","Cantarell","Cantata One","Cantora One","Caprasimo","Capriola","Caramel","Carattere","Cardo","Carlito","Carme","Carrois Gothic","Carrois Gothic SC","Carter One","Cascadia Code","Cascadia Mono","Castoro","Castoro Titling","Catamaran","Caudex","Cause","Caveat","Caveat Brush","Cedarville Cursive","Ceviche One","Chakra Petch","Changa","Changa One","Chango","Charis SIL","Charm","Charmonman","Chathura","Chau Philomene One","Chela One","Chelsea Market","Chenla","Cherish","Cherry Bomb One","Cherry Cream Soda","Cherry Swash","Chewy","Chicle","Chilanka","Chiron GoRound TC","Chiron Hei HK","Chiron Sung HK","Chivo","Chivo Mono","Chocolate Classical Sans","Chokokutai","Chonburi","Cinzel","Cinzel Decorative","Clicker Script","Climate Crisis","Coda","Codystar","Coiny","Combo","Comfortaa","Comforter","Comforter Brush","Comic Neue","Comic Relief","Coming Soon","Comme","Commissioner","Concert One","Condiment","Content","Contrail One","Convergence","Cookie","Copse","Coral Pixels","Corben","Corinthia","Cormorant","Cormorant Garamond","Cormorant Infant","Cormorant SC","Cormorant Unicase","Cormorant Upright","Cossette Texte","Cossette Titre","Courgette","Courier Prime","Cousine","Coustard","Covered By Your Grace","Crafty Girls","Creepster","Crete Round","Crimson Pro","Crimson Text","Croissant One","Crushed","Cuprum","Cute Font","Cutive","Cutive Mono","Dai Banna SIL","Damion","Dancing Script","Danfo","Dangrek","Darker Grotesque","Darumadrop One","Datatype","David Libre","Dawning of a New Day","Days One","Dekko","Dela Gothic One","Delicious Handrawn","Delius","Delius Swash Caps","Delius Unicase","Della Respira","Denk One","Devonshire","Dhurjati","Didact Gothic","Diphylleia","Diplomata","Diplomata SC","DM Mono","DM Sans","DM Serif Display","DM Serif Text","Do Hyeon","Dokdo","Domine","Donegal One","Dongle","Doppio One","Dorsa","Dosis","DotGothic16","Doto","Dr Sugiyama","Duru Sans","Dynalight","DynaPuff","Eagle Lake","East Sea Dokdo","Eater","EB Garamond","Economica","Eczar","Edu AU VIC WA NT Arrows","Edu AU VIC WA NT Dots","Edu AU VIC WA NT Guides","Edu AU VIC WA NT Hand","Edu AU VIC WA NT Pre","Edu NSW ACT Cursive","Edu NSW ACT Foundation","Edu NSW ACT Hand Pre","Edu QLD Beginner","Edu QLD Hand","Edu SA Beginner","Edu SA Hand","Edu TAS Beginner","Edu VIC WA NT Beginner","Edu VIC WA NT Hand","Edu VIC WA NT Hand Pre","El Messiri","Electrolize","Elms Sans","Elsie","Elsie Swash Caps","Emblema One","Emilys Candy","Encode Sans","Encode Sans Condensed","Encode Sans Expanded","Encode Sans SC","Encode Sans Semi Condensed","Encode Sans Semi Expanded","Engagement","Englebert","Enriqueta","Ephesis","Epilogue","Epunda Sans","Epunda Slab","Erica One","Esteban","Estedad","Estonia","Euphoria Script","Ewert","Exile","Exo","Exo 2","Expletus Sans","Explora","Faculty Glyphic","Fahkwang","Familjen Grotesk","Fanwood Text","Farro","Farsan","Fascinate","Fascinate Inline","Faster One","Fasthand","Fauna One","Faustina","Federant","Federo","Felipa","Fenix","Festive","Figtree","Finger Paint","Finlandica Headline","Finlandica Text","Fira Code","Fira Mono","Fira Sans","Fira Sans Condensed","Fira Sans Extra Condensed","Fjalla One","Fjord One","Flamenco","Flavors","Fleur De Leah","Flow Block","Flow Circular","Flow Rounded","Foldit","Fondamento","Fontdiner Swanky","Forum","Fragment Mono","Francois One","Frank Ruhl Libre","Fraunces","Freckle Face","Fredericka the Great","Fredoka","Freehand","Freeman","Fresca","Frijole","Fruktur","Fugaz One","Fuggles","Funnel Display","Funnel Sans","Fustat","Fuzzy Bubbles","Ga Maamli","Gabarito","Gabriela","Gaegu","Gafata","Gajraj One","Galada","Galdeano","Galindo","Gamja Flower","Gantari","Gasoek One","Gayathri","Geist","Geist Mono","Geist Pixel","Gelasio","Gemunu Libre","Genos","Gentium Book Plus","Gentium Plus","Geo","Geologica","Geom","Geomini","Georama","Geostar","Geostar Fill","Germania One","GFS Didot","GFS Neohellenic","Gideon Roman","Gidole","Gidugu","Gilda Display","Girassol","Give You Glory","Glass Antiqua","Glegoo","Gloock","Gloria Hallelujah","Glory","Gluten","Goblin One","Gochi Hand","Goldman","Golos Text","Google Sans","Google Sans Code","Google Sans Flex","Gorditas","Gothic A1","Gotu","Goudy Bookletter 1911","Gowun Batang","Gowun Dodum","Graduate","Grand Hotel","Grandiflora One","Grandstander","Grape Nuts","Gravitas One","Great Vibes","Grechen Fuemen","Grenze","Grenze Gotisch","Grey Qo","Griffy","Gruppo","Gudea","Gugi","Gulzar","Gupter","Gurajada","Gveret Levin","Gwendolyn","Habibi","Hachi Maru Pop","Hahmlet","Halant","Hammersmith One","Hanalei","Hanalei Fill","Handjet","Handlee","Hanken Grotesk","Hanuman","Happy Monkey","Harmattan","Headland One","Hedvig Letters Sans","Hedvig Letters Serif","Heebo","Henny Penny","Hepta Slab","Herr Von Muellerhoff","Hi Melody","Hibur Mono","Hina Mincho","Hind","Hind Guntur","Hind Madurai","Hind Mysuru","Hind Siliguri","Hind Vadodara","Holtwood One SC","Homemade Apple","Homenaje","Honk","Host Grotesk","Hubballi","Hubot Sans","Huninn","Hurricane","Iansui","Ibarra Real Nova","IBM Plex Mono","IBM Plex Sans","IBM Plex Sans Arabic","IBM Plex Sans Condensed","IBM Plex Sans Devanagari","IBM Plex Sans Hebrew","IBM Plex Sans JP","IBM Plex Sans KR","IBM Plex Sans Thai","IBM Plex Sans Thai Looped","IBM Plex Serif","Iceberg","Iceland","Idiqlat","IM Fell Double Pica","IM Fell Double Pica SC","IM Fell DW Pica","IM Fell DW Pica SC","IM Fell English","IM Fell English SC","IM Fell French Canon","IM Fell French Canon SC","IM Fell Great Primer","IM Fell Great Primer SC","Imbue","Imperial Script","Imprima","Inclusive Sans","Inconsolata","Inder","Indie Flower","Ingrid Darling","Inika","Inknut Antiqua","Inria Sans","Inria Serif","Inspiration","Instrument Sans","Instrument Serif","Intel One Mono","Inter","Inter Tight","Iosevka Charon","Iosevka Charon Mono","Irish Grover","Island Moments","Istok Web","Italiana","Italianno","Itim","Jacquard 12","Jacquard 12 Charted","Jacquard 24","Jacquard 24 Charted","Jacquarda Bastarda 9","Jacquarda Bastarda 9 Charted","Jacques Francois","Jacques Francois Shadow","Jaini","Jaini Purva","Jaldi","Jaro","Jersey 10","Jersey 10 Charted","Jersey 15","Jersey 15 Charted","Jersey 20","Jersey 20 Charted","Jersey 25","Jersey 25 Charted","JetBrains Mono","Jim Nightshade","Joan","Jockey One","Jolly Lodger","Jomhuria","Jomolhari","Josefin Sans","Josefin Slab","Jost","Joti One","Jua","Judson","Julee","Julius Sans One","Junge","Jura","Just Another Hand","Just Me Again Down Here","K2D","Kablammo","Kadwa","Kaisei Decol","Kaisei HarunoUmi","Kaisei Opti","Kaisei Tokumin","Kalam","Kalnia","Kalnia Glaze","Kameron","Kanchenjunga","Kanit","Kantumruy Pro","Kapakana","Karantina","Karla","Karla Tamil Inclined","Karla Tamil Upright","Karma","Katibeh","Kaushan Script","Kavivanar","Kavoon","Kay Pho Du","Kdam Thmor Pro","Keania One","Kedebideri","Kelly Slab","Kenia","Khand","Khmer","Khula","Kings","Kirang Haerang","Kite One","Kiwi Maru","Klee One","Knewave","Kodchasan","Kode Mono","Koh Santepheap","KoHo","Kolker Brush","Konkhmer Sleokchher","Kosugi","Kosugi Maru","Kotta One","Koulen","Kranky","Kreon","Kristi","Krona One","Krub","Kufam","Kulim Park","Kumar One","Kumar One Outline","Kumbh Sans","Kurale","La Belle Aurore","Labrada","Lacquer","Laila","Lakki Reddy","Lalezar","Lancelot","Langar","Lateef","Lato","Lavishly Yours","League Gothic","League Script","League Spartan","Leckerli One","Ledger","Lekton","Lemon","Lemonada","Lexend","Lexend Deca","Lexend Exa","Lexend Giga","Lexend Mega","Lexend Peta","Lexend Tera","Lexend Zetta","Libertinus Keyboard","Libertinus Math","Libertinus Mono","Libertinus Sans","Libertinus Serif","Libertinus Serif Display","Libre Barcode 128","Libre Barcode 128 Text","Libre Barcode 39","Libre Barcode 39 Extended","Libre Barcode 39 Extended Text","Libre Barcode 39 Text","Libre Barcode EAN13 Text","Libre Baskerville","Libre Bodoni","Libre Caslon Display","Libre Caslon Text","Libre Franklin","Licorice","Life Savers","Lilex","Lilita One","Lily Script One","Limelight","Linden Hill","LINE Seed JP","Linefont","Lisu Bosa","Liter","Literata","Liu Jian Mao Cao","Livvic","Lobster","Lobster Two","Londrina Outline","Londrina Shadow","Londrina Sketch","Londrina Solid","Long Cang","Lora","Love Light","Love Ya Like A Sister","Loved by the King","Lovers Quarrel","Luckiest Guy","Lugrasimo","Lumanosimo","Lunasima","Lusitana","Lustria","Luxurious Roman","Luxurious Script","LXGW Marker Gothic","LXGW WenKai Mono TC","LXGW WenKai TC","M PLUS 1","M PLUS 1 Code","M PLUS 1p","M PLUS 2","M PLUS Code Latin","M PLUS Rounded 1c","M PLUS U","Ma Shan Zheng","Macondo","Macondo Swash Caps","Mada","Madimi One","Magra","Maiden Orange","Maitree","Major Mono Display","Mako","Mali","Mallanna","Maname","Mandali","Manjari","Manrope","Mansalva","Manuale","Manufacturing Consent","Marcellus","Marcellus SC","Marck Script","Margarine","Marhey","Markazi Text","Marko One","Marmelad","Martel","Martel Sans","Martian Mono","Marvel","Matangi","Mate","Mate SC","Matemasie","Maven Pro","McLaren","Mea Culpa","Meddon","MedievalSharp","Medula One","Meera Inimai","Megrim","Meie Script","Menbere","Meow Script","Merienda","Merriweather","Merriweather Sans","Metal","Metal Mania","Metamorphous","Metrophobic","Michroma","Micro 5","Micro 5 Charted","Milonga","Miltonian","Miltonian Tattoo","Mina","Mingzat","Miniver","Miranda Sans","Miriam Libre","Mirza","Miss Fajardose","Mitr","Mochiy Pop One","Mochiy Pop P One","Modak","Modern Antiqua","Moderustic","Mogra","Mohave","Moirai One","Molengo","Molle","Momo Signature","Momo Trust Display","Momo Trust Sans","Mona Sans","Monda","Monofett","Monomakh","Monomaniac One","Monoton","Monsieur La Doulaise","Montaga","Montagu Slab","MonteCarlo","Montenegrin Gothic One","Montez","Montserrat","Montserrat Alternates","Montserrat Underline","Moo Lah Lah","Mooli","Moon Dance","Moul","Moulpali","Mountains of Christmas","Mouse Memoirs","Mozilla Headline","Mozilla Text","Mr Bedfort","Mr Dafoe","Mr De Haviland","Mrs Saint Delafield","Mrs Sheppards","Ms Madi","Mukta","Mukta Mahee","Mukta Malar","Mukta Vaani","Mulish","Murecho","MuseoModerno","My Soul","Mynerve","Mystery Quest","Nabla","Namdhinggo","Nanum Brush Script","Nanum Gothic","Nanum Gothic Coding","Nanum Myeongjo","Nanum Pen Script","Narnoor","Nata Sans","National Park","Neonderthaw","Nerko One","Neucha","Neuton","New Amsterdam","New Rocker","New Tegomin","News Cycle","Newsreader","Niconne","Niramit","Nixie One","Nobile","Nokora","Norican","Nosifer","Notable","Nothing You Could Do","Noticia Text","Noto Color Emoji","Noto Emoji","Noto Kufi Arabic","Noto Music","Noto Naskh Arabic","Noto Nastaliq Urdu","Noto Rashi Hebrew","Noto Sans","Noto Sans Adlam","Noto Sans Adlam Unjoined","Noto Sans Anatolian Hieroglyphs","Noto Sans Arabic","Noto Sans Armenian","Noto Sans Avestan","Noto Sans Balinese","Noto Sans Bamum","Noto Sans Bassa Vah","Noto Sans Batak","Noto Sans Bengali","Noto Sans Bhaiksuki","Noto Sans Brahmi","Noto Sans Buginese","Noto Sans Buhid","Noto Sans Canadian Aboriginal","Noto Sans Carian","Noto Sans Caucasian Albanian","Noto Sans Chakma","Noto Sans Cham","Noto Sans Cherokee","Noto Sans Chorasmian","Noto Sans Coptic","Noto Sans Cuneiform","Noto Sans Cypriot","Noto Sans Cypro Minoan","Noto Sans Deseret","Noto Sans Devanagari","Noto Sans Display","Noto Sans Duployan","Noto Sans Egyptian Hieroglyphs","Noto Sans Elbasan","Noto Sans Elymaic","Noto Sans Ethiopic","Noto Sans Georgian","Noto Sans Glagolitic","Noto Sans Gothic","Noto Sans Grantha","Noto Sans Gujarati","Noto Sans Gunjala Gondi","Noto Sans Gurmukhi","Noto Sans Hanifi Rohingya","Noto Sans Hanunoo","Noto Sans Hatran","Noto Sans Hebrew","Noto Sans HK","Noto Sans Imperial Aramaic","Noto Sans Indic Siyaq Numbers","Noto Sans Inscriptional Pahlavi","Noto Sans Inscriptional Parthian","Noto Sans Javanese","Noto Sans JP","Noto Sans Kaithi","Noto Sans Kannada","Noto Sans Kawi","Noto Sans Kayah Li","Noto Sans Kharoshthi","Noto Sans Khmer","Noto Sans Khojki","Noto Sans Khudawadi","Noto Sans KR","Noto Sans Lao","Noto Sans Lao Looped","Noto Sans Lepcha","Noto Sans Limbu","Noto Sans Linear A","Noto Sans Linear B","Noto Sans Lisu","Noto Sans Lycian","Noto Sans Lydian","Noto Sans Mahajani","Noto Sans Malayalam","Noto Sans Mandaic","Noto Sans Manichaean","Noto Sans Marchen","Noto Sans Masaram Gondi","Noto Sans Math","Noto Sans Mayan Numerals","Noto Sans Medefaidrin","Noto Sans Meetei Mayek","Noto Sans Mende Kikakui","Noto Sans Meroitic","Noto Sans Miao","Noto Sans Modi","Noto Sans Mongolian","Noto Sans Mono","Noto Sans Mro","Noto Sans Multani","Noto Sans Myanmar","Noto Sans Nabataean","Noto Sans Nag Mundari","Noto Sans Nandinagari","Noto Sans New Tai Lue","Noto Sans Newa","Noto Sans NKo","Noto Sans NKo Unjoined","Noto Sans Nushu","Noto Sans Ogham","Noto Sans Ol Chiki","Noto Sans Old Hungarian","Noto Sans Old Italic","Noto Sans Old North Arabian","Noto Sans Old Permic","Noto Sans Old Persian","Noto Sans Old Sogdian","Noto Sans Old South Arabian","Noto Sans Old Turkic","Noto Sans Oriya","Noto Sans Osage","Noto Sans Osmanya","Noto Sans Pahawh Hmong","Noto Sans Palmyrene","Noto Sans Pau Cin Hau","Noto Sans PhagsPa","Noto Sans Phoenician","Noto Sans Psalter Pahlavi","Noto Sans Rejang","Noto Sans Runic","Noto Sans Samaritan","Noto Sans Saurashtra","Noto Sans SC","Noto Sans Sharada","Noto Sans Shavian","Noto Sans Siddham","Noto Sans SignWriting","Noto Sans Sinhala","Noto Sans Sogdian","Noto Sans Sora Sompeng","Noto Sans Soyombo","Noto Sans Sundanese","Noto Sans Sunuwar","Noto Sans Syloti Nagri","Noto Sans Symbols","Noto Sans Symbols 2","Noto Sans Syriac","Noto Sans Syriac Eastern","Noto Sans Syriac Western","Noto Sans Tagalog","Noto Sans Tagbanwa","Noto Sans Tai Le","Noto Sans Tai Tham","Noto Sans Tai Viet","Noto Sans Takri","Noto Sans Tamil","Noto Sans Tamil Supplement","Noto Sans Tangsa","Noto Sans TC","Noto Sans Telugu","Noto Sans Thaana","Noto Sans Thai","Noto Sans Thai Looped","Noto Sans Tifinagh","Noto Sans Tirhuta","Noto Sans Ugaritic","Noto Sans Vai","Noto Sans Vithkuqi","Noto Sans Wancho","Noto Sans Warang Citi","Noto Sans Yi","Noto Sans Zanabazar Square","Noto Serif","Noto Serif Ahom","Noto Serif Armenian","Noto Serif Balinese","Noto Serif Bengali","Noto Serif Devanagari","Noto Serif Display","Noto Serif Dives Akuru","Noto Serif Dogra","Noto Serif Ethiopic","Noto Serif Georgian","Noto Serif Grantha","Noto Serif Gujarati","Noto Serif Gurmukhi","Noto Serif Hebrew","Noto Serif Hentaigana","Noto Serif HK","Noto Serif JP","Noto Serif Kannada","Noto Serif Khitan Small Script","Noto Serif Khmer","Noto Serif Khojki","Noto Serif KR","Noto Serif Lao","Noto Serif Makasar","Noto Serif Malayalam","Noto Serif Myanmar","Noto Serif NP Hmong","Noto Serif Old Uyghur","Noto Serif Oriya","Noto Serif Ottoman Siyaq","Noto Serif SC","Noto Serif Sinhala","Noto Serif Tamil","Noto Serif Tangut","Noto Serif TC","Noto Serif Telugu","Noto Serif Thai","Noto Serif Tibetan","Noto Serif Todhri","Noto Serif Toto","Noto Serif Vithkuqi","Noto Serif Yezidi","Noto Traditional Nushu","Noto Znamenny Musical Notation","Nova Cut","Nova Flat","Nova Mono","Nova Oval","Nova Round","Nova Script","Nova Slim","Nova Square","NTR","Numans","Nunito","Nunito Sans","Nuosu SIL","Odibee Sans","Odor Mean Chey","Offside","Oi","Ojuju","Old Standard TT","Oldenburg","Ole","Oleo Script","Oleo Script Swash Caps","Onest","Oooh Baby","Open Sans","Oranienbaum","Orbit","Orbitron","Oregano","Orelega One","Orienta","Original Surfer","Oswald","Outfit","Over the Rainbow","Overlock","Overlock SC","Overpass","Overpass Mono","Ovo","Oxanium","Oxygen","Oxygen Mono","Pacifico","Padauk","Padyakke Expanded One","Palanquin","Palanquin Dark","Palette Mosaic","Pangolin","Paprika","Parastoo","Parisienne","Parkinsans","Passero One","Passion One","Passions Conflict","Pathway Extreme","Pathway Gothic One","Patrick Hand","Patrick Hand SC","Pattaya","Patua One","Pavanam","Paytone One","Peddana","Peralta","Permanent Marker","Petemoss","Petit Formal Script","Petrona","Phetsarath","Philosopher","Phudu","Piazzolla","Piedra","Pinyon Script","Pirata One","Pixelify Sans","Plaster","Platypi","Play","Playball","Playfair","Playfair Display","Playfair Display SC","Playpen Sans","Playpen Sans Arabic","Playpen Sans Deva","Playpen Sans Hebrew","Playpen Sans Thai","Playwrite AR","Playwrite AR Guides","Playwrite AT","Playwrite AT Guides","Playwrite AU NSW","Playwrite AU NSW Guides","Playwrite AU QLD","Playwrite AU QLD Guides","Playwrite AU SA","Playwrite AU SA Guides","Playwrite AU TAS","Playwrite AU TAS Guides","Playwrite AU VIC","Playwrite AU VIC Guides","Playwrite BE VLG","Playwrite BE VLG Guides","Playwrite BE WAL","Playwrite BE WAL Guides","Playwrite BR","Playwrite BR Guides","Playwrite CA","Playwrite CA Guides","Playwrite CL","Playwrite CL Guides","Playwrite CO","Playwrite CO Guides","Playwrite CU","Playwrite CU Guides","Playwrite CZ","Playwrite CZ Guides","Playwrite DE Grund","Playwrite DE Grund Guides","Playwrite DE LA","Playwrite DE LA Guides","Playwrite DE SAS","Playwrite DE SAS Guides","Playwrite DE VA","Playwrite DE VA Guides","Playwrite DK Loopet","Playwrite DK Loopet Guides","Playwrite DK Uloopet","Playwrite DK Uloopet Guides","Playwrite ES","Playwrite ES Deco","Playwrite ES Deco Guides","Playwrite ES Guides","Playwrite FR Moderne","Playwrite FR Moderne Guides","Playwrite FR Trad","Playwrite FR Trad Guides","Playwrite GB J","Playwrite GB J Guides","Playwrite GB S","Playwrite GB S Guides","Playwrite HR","Playwrite HR Guides","Playwrite HR Lijeva","Playwrite HR Lijeva Guides","Playwrite HU","Playwrite HU Guides","Playwrite ID","Playwrite ID Guides","Playwrite IE","Playwrite IE Guides","Playwrite IN","Playwrite IN Guides","Playwrite IS","Playwrite IS Guides","Playwrite IT Moderna","Playwrite IT Moderna Guides","Playwrite IT Trad","Playwrite IT Trad Guides","Playwrite MX","Playwrite MX Guides","Playwrite NG Modern","Playwrite NG Modern Guides","Playwrite NL","Playwrite NL Guides","Playwrite NO","Playwrite NO Guides","Playwrite NZ","Playwrite NZ Basic","Playwrite NZ Basic Guides","Playwrite NZ Guides","Playwrite PE","Playwrite PE Guides","Playwrite PL","Playwrite PL Guides","Playwrite PT","Playwrite PT Guides","Playwrite RO","Playwrite RO Guides","Playwrite SK","Playwrite SK Guides","Playwrite TZ","Playwrite TZ Guides","Playwrite US Modern","Playwrite US Modern Guides","Playwrite US Trad","Playwrite US Trad Guides","Playwrite VN","Playwrite VN Guides","Playwrite ZA","Playwrite ZA Guides","Pliant","Plus Jakarta Sans","Pochaevsk","Podkova","Poetsen One","Poiret One","Poller One","Poltawski Nowy","Poly","Pompiere","Ponnala","Ponomar","Pontano Sans","Poor Story","Poppins","Port Lligat Sans","Port Lligat Slab","Potta One","Pragati Narrow","Praise","Prata","Preahvihear","Press Start 2P","Pridi","Princess Sofia","Prociono","Prompt","Prosto One","Protest Guerrilla","Protest Revolution","Protest Riot","Protest Strike","Proza Libre","PT Mono","PT Sans","PT Sans Caption","PT Sans Narrow","PT Serif","PT Serif Caption","Public Sans","Puppies Play","Puritan","Purple Purse","Qahiri","Quando","Quantico","Quattrocento","Quattrocento Sans","Questrial","Quicksand","Quintessential","Qwigley","Qwitcher Grypen","Racing Sans One","Radio Canada","Radio Canada Big","Radley","Rajdhani","Rakkas","Raleway","Raleway Dots","Ramabhadra","Ramaraja","Rambla","Rammetto One","Rampart One","Ramsina","Ranchers","Rancho","Ranga","Rasa","Rationale","Ravi Prakash","Readex Pro","Recursive","Red Hat Display","Red Hat Mono","Red Hat Text","Red Rose","Redacted","Redacted Script","Reddit Mono","Reddit Sans","Reddit Sans Condensed","Redressed","Reem Kufi","Reem Kufi Fun","Reem Kufi Ink","Reenie Beanie","Reggae One","REM","Rethink Sans","Revalia","Rhodium Libre","Ribeye","Ribeye Marrow","Righteous","Risque","Road Rage","Roboto","Roboto Condensed","Roboto Flex","Roboto Mono","Roboto Serif","Roboto Slab","Rochester","Rock 3D","Rock Salt","RocknRoll One","Rokkitt","Romanesco","Ropa Sans","Rosario","Rosarivo","Rouge Script","Rowdies","Rozha One","Rubik","Rubik 80s Fade","Rubik Beastly","Rubik Broken Fax","Rubik Bubbles","Rubik Burned","Rubik Dirt","Rubik Distressed","Rubik Doodle Shadow","Rubik Doodle Triangles","Rubik Gemstones","Rubik Glitch","Rubik Glitch Pop","Rubik Iso","Rubik Lines","Rubik Maps","Rubik Marker Hatch","Rubik Maze","Rubik Microbe","Rubik Mono One","Rubik Moonrocks","Rubik Pixels","Rubik Puddles","Rubik Scribble","Rubik Spray Paint","Rubik Storm","Rubik Vinyl","Rubik Wet Paint","Ruda","Rufina","Ruge Boogie","Ruluko","Rum Raisin","Ruslan Display","Russo One","Ruthie","Ruwudu","Rye","Sacramento","Sahitya","Sail","Saira","Saira Condensed","Saira Extra Condensed","Saira Semi Condensed","Saira Stencil","Salsa","Sanchez","Sancreek","Sankofa Display","Sansation","Sansita","Sansita Swashed","Sarabun","Sarala","Sarina","Sarpanch","Sassy Frass","Satisfy","Savate","Sawarabi Gothic","Sawarabi Mincho","Scada","Scheherazade New","Schibsted Grotesk","Schoolbell","Science Gothic","Scope One","Scoutie Sans","Seaweed Script","Secular One","Sedan","Sedan SC","Sedgwick Ave","Sedgwick Ave Display","Sekuya","Sen","Send Flowers","Sevillana","Seymour One","Shadows Into Light","Shadows Into Light Two","Shafarik","Shalimar","Shantell Sans","Shanti","Share","Share Tech","Share Tech Mono","Shippori Antique","Shippori Antique B1","Shippori Mincho","Shippori Mincho B1","Shizuru","Shojumaru","Short Stack","Shrikhand","Siemreap","Sigmar","Sigmar One","Signika","Signika Negative","Silkscreen","Simonetta","Single Day","Sintony","Sirin Stencil","Sirivennela","Six Caps","Sixtyfour","Sixtyfour Convergence","Skranji","Slabo 13px","Slabo 27px","Slackey","Slackside One","Smokum","Smooch","Smooch Sans","Smythe","SN Pro","Sniglet","Snippet","Snowburst One","Sofadi One","Sofia","Sofia Sans","Sofia Sans Condensed","Sofia Sans Extra Condensed","Sofia Sans Semi Condensed","Solitreo","Solway","Sometype Mono","Song Myung","Sono","Sonsie One","Sora","Sorts Mill Goudy","Sour Gummy","Source Code Pro","Source Sans 3","Source Serif 4","Space Grotesk","Space Mono","Special Elite","Special Gothic","Special Gothic Condensed One","Special Gothic Expanded One","Spectral","Spectral SC","Spicy Rice","Spinnaker","Spirax","Splash","Spline Sans","Spline Sans Mono","Squada One","Square Peg","Sree Krushnadevaraya","Sriracha","Srisakdi","Staatliches","Stack Sans Headline","Stack Sans Notch","Stack Sans Text","Stalemate","Stalinist One","Stardos Stencil","Stick","Stick No Bills","Stint Ultra Condensed","Stint Ultra Expanded","STIX Two Math","STIX Two Text","Stoke","Story Script","Strait","Strichpunkt Sans","Style Script","Stylish","Sue Ellen Francisco","Suez One","Sulphur Point","Sumana","Sunflower","Sunshiney","Supermercado One","Sura","Suranna","Suravaram","SUSE","SUSE Mono","Suwannaphum","Swanky and Moo Moo","Syncopate","Syne","Syne Mono","Syne Tactile","Tac One","Tagesschrift","Tai Heritage Pro","Tajawal","Tangerine","Tapestry","Taprom","TASA Explorer","TASA Orbiter","Tauri","Taviraj","Teachers","Teko","Tektur","Telex","Tenali Ramakrishna","Tenor Sans","Text Me One","Texturina","Thasadith","The Girl Next Door","The Nautigal","Tienne","TikTok Sans","Tillana","Tilt Neon","Tilt Prism","Tilt Warp","Timmana","Tinos","Tiny5","Tiro Bangla","Tiro Devanagari Hindi","Tiro Devanagari Marathi","Tiro Devanagari Sanskrit","Tiro Gurmukhi","Tiro Kannada","Tiro Tamil","Tiro Telugu","Tirra","Titan One","Titillium Web","Tomorrow","Tourney","Trade Winds","Train One","Triodion","Trirong","Trispace","Trocchi","Trochut","Truculenta","Trykker","Tsukimi Rounded","Tuffy","Tulpen One","Turret Road","Twinkle Star","Ubuntu","Ubuntu Condensed","Ubuntu Mono","Ubuntu Sans","Ubuntu Sans Mono","Uchen","Ultra","Unbounded","Uncial Antiqua","Underdog","Unica One","UnifrakturCook","UnifrakturMaguntia","Unkempt","Unlock","Unna","UoqMunThenKhung","Updock","Urbanist","Valley Sans","Vampiro One","Varela","Varela Round","Varta","Vast Shadow","Vazirmatn","Vend Sans","Vesper Libre","Viaoda Libre","Vibes","Vibur","Victor Mono","Vidaloka","Viga","Vina Sans","Voces","Volkhov","Vollkorn","Vollkorn SC","Voltaire","VT323","Vujahday Script","Waiting for the Sunrise","Wallpoet","Walter Turncoat","Warnes","Water Brush","Waterfall","Wavefont","WDXL Lubrifont JP N","WDXL Lubrifont SC","WDXL Lubrifont TC","Wellfleet","Wendy One","Whisper","WindSong","Winky Rough","Winky Sans","Wire One","Wittgenstein","Wix Madefor Display","Wix Madefor Text","Work Sans","Workbench","Xanh Mono","Yaldevi","Yanone Kaffeesatz","Yantramanav","Yarndings 12","Yarndings 12 Charted","Yarndings 20","Yarndings 20 Charted","Yatra One","Yellowtail","Yeon Sung","Yeseva One","Yesteryear","Yomogi","Young Serif","Yrsa","Ysabeau","Ysabeau Infant","Ysabeau Office","Ysabeau SC","Yuji Boku","Yuji Hentaigana Akari","Yuji Hentaigana Akebono","Yuji Mai","Yuji Syuku","Yusei Magic","Yuyu","Yuyu Short","Zain","Zalando Sans","Zalando Sans Expanded","Zalando Sans SemiExpanded","ZCOOL KuaiLe","ZCOOL QingKe HuangYou","ZCOOL XiaoWei","Zen Antique","Zen Antique Soft","Zen Dots","Zen Kaku Gothic Antique","Zen Kaku Gothic New","Zen Kurenaido","Zen Loop","Zen Maru Gothic","Zen Old Mincho","Zen Tokyo Zoo","Zeyada","Zhi Mang Xing","Zilla Slab","Zilla Slab Highlight"],"cjkFonts":["Bpmf Huninn","Bpmf Iansui","Bpmf Zihi Kai Std","Cactus Classical Serif","Chiron GoRound TC","Chiron Hei HK","Chiron Sung HK","Chocolate Classical Sans","Huninn","Iansui","Liu Jian Mao Cao","Long Cang","LXGW Marker Gothic","LXGW WenKai Mono TC","LXGW WenKai TC","Ma Shan Zheng","Noto Sans HK","Noto Sans Inscriptional Pahlavi","Noto Sans Inscriptional Parthian","Noto Sans SC","Noto Sans TC","Noto Serif HK","Noto Serif Khitan Small Script","Noto Serif SC","Noto Serif TC","UoqMunThenKhung","WDXL Lubrifont SC","WDXL Lubrifont TC","ZCOOL KuaiLe","ZCOOL QingKe HuangYou","ZCOOL XiaoWei","Zhi Mang Xing"]};

  });

  define("./src/data/presets.js", function(__require, exports) {
/**
 * 風格預設集資料定義（完全遵循 SPEC 第 2.4 節、附錄 A 與參數化旋鈕系統架構）
 * 深度凍結，執行期完全唯讀
 */
const { defaultState } = __require("../core/defaultState.js");

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
const PRESETS = exports.PRESETS = Object.freeze([
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

  });

  define("./src/export/toDtcg.js", function(__require, exports) {
/* AppState → W3C DTCG Token 物件轉換器（純函式，零 DOM 依賴，完全遵循 SPEC 第 11.2 節與參數化旋鈕系統架構） */
const { buildRamp, RAMP_STEPS } = __require("../color/ramp.js");
const { deriveSurfaceColors, TYPE_SCALE_TABLE } = __require("../tokens/derive.js");
const { runA11yAudit } = __require("../a11y/audit.js");

/* 多語語言偵測 (SPEC 11.4) */
exports.stateToDtcg = stateToDtcg; function stateToDtcg(state) {
  const audit = runA11yAudit(state);

  // neutralRamp is derived inside the loop
  // Surface colors are derived inside the modes loop now

  const dtcg = {
    $description: "Design tokens — machine-readable layer only.",
    meta: {
      generator: "Design Token Builder",
      generatedAt: new Date().toISOString(),
      tokenFormat: "w3c-dtcg",
      a11yStatus: audit.pass ? "pass" : "partial",
      a11yFailCount: audit.failCount
    },

    color: {
      $type: "color",
      semantic: {},
      light: {},
      dark: {}
    },

    typography: {
      $type: "typography",
      families: {
        $type: "fontFamily",
        heading: { $value: [state.typography.families.heading, state.typography.families.cjkHeading || state.typography.families.cjk || "Noto Sans TC"] },
        body:    { $value: [state.typography.families.body, state.typography.families.cjkBody || state.typography.families.cjk || "Noto Sans TC"] },
        label:   { $value: [state.typography.families.label || state.typography.families.heading || "Roboto", state.typography.families.cjkLabel || state.typography.families.cjk || "Noto Sans TC"] }
      }
    },

    appearance: {
      radius: {
        $type: "dimension"
      },
      elevation: {},
      shape: {},
      component: {}
    }
  };

  /* 1. 處理顏色 (Light & Dark 模式分離) */
  const modes = ["light", "dark"];
  modes.forEach(mode => {
    const currentColors = state.colors[mode];
    if (!currentColors) return;

    const modeObj = {};

    for (const primary of currentColors.primaries) {
      const ramp = buildRamp(primary.seed, false);
      const rampObj = {};
      RAMP_STEPS.forEach((step, i) => {
        rampObj[step] = { $value: ramp[i].toLowerCase() };
      });
      modeObj[primary.id] = rampObj;
    }

    const neutralRamp = buildRamp(currentColors.neutral.seed, true);
    const neutralRampObj = {};
    RAMP_STEPS.forEach((step, i) => {
      neutralRampObj[step] = { $value: neutralRamp[i].toLowerCase() };
    });
    modeObj.neutral = neutralRampObj;

    if (currentColors.link) {
      const linkRamp = buildRamp(currentColors.link.seed, false);
      const linkRampObj = {};
      RAMP_STEPS.forEach((step, i) => {
        linkRampObj[step] = { $value: linkRamp[i].toLowerCase() };
      });
      modeObj.link = linkRampObj;
    }

    if (currentColors.accents) {
      for (const accent of currentColors.accents) {
        const ramp = buildRamp(accent.seed, false);
        const rampObj = {};
        RAMP_STEPS.forEach((step, i) => {
          rampObj[step] = { $value: ramp[i].toLowerCase() };
        });
        modeObj[accent.id] = rampObj;
      }
    }

    if (currentColors.semantic) {
      modeObj.semantic = {};
      for (const [k, seed] of Object.entries(currentColors.semantic)) {
        modeObj.semantic[k] = { $value: seed.toLowerCase() };
      }
    }

    const surfaces = deriveSurfaceColors(neutralRamp, currentColors.surface, mode);
    modeObj.surface = {
      bg:      { $value: surfaces.bg.toLowerCase() },
      surface: { $value: surfaces.surface.toLowerCase() },
      btnSecondaryBg: { $value: surfaces.btnSecondaryBg.toLowerCase() },
      btnInvertedBg: { $value: surfaces.btnInvertedBg.toLowerCase() },
      text:    { $value: surfaces.text.toLowerCase() },
      border:  { $value: surfaces.border.toLowerCase() }
    };

    dtcg.color[mode] = modeObj;
  });

  /* 3. 圓角 */
  const shape = state.shape || {};
  const baseRad = shape.radiusBase ?? 12;
  const cornerStrat = shape.cornerStrategy || "rounded-consistent";
  let radSm, radMd, radLg, radXl;

  if (cornerStrat === "sharp") {
    radSm = 0; radMd = 0; radLg = 0; radXl = 0;
  } else if (cornerStrat === "rounded-mixed") {
    radSm = 4; radMd = 6; radLg = 18; radXl = 24;
  } else if (cornerStrat === "rounded-fixed") {
    radSm = baseRad; radMd = baseRad; radLg = baseRad; radXl = baseRad;
  } else {
    radSm = Math.round(baseRad * 0.5);
    radMd = baseRad;
    radLg = Math.round(baseRad * 1.5);
    radXl = baseRad * 2;
  }

  Object.assign(dtcg.appearance.radius, {
    sm:   { $value: { value: radSm, unit: "px" } },
    md:   { $value: { value: radMd, unit: "px" } },
    lg:   { $value: { value: radLg, unit: "px" } },
    xl:   { $value: { value: radXl, unit: "px" } },
    full: { $value: { value: 9999, unit: "px" } }
  });

  /* 4. 字型 9 階 */
  const baseSize = state.typography.scale?.baseSize || 16;
  const ratio = state.typography.scale?.ratio || 1.25;
  const overrides = state.typography.overrides || {};

  for (const [step, def] of Object.entries(TYPE_SCALE_TABLE)) {
    const computedSize = Math.round(baseSize * Math.pow(ratio, def.power));
    const ovr = overrides[step] || {};
    const lsVal = typeof ovr.letterSpacing !== "undefined"
      ? (typeof ovr.letterSpacing === "number" ? ovr.letterSpacing : parseFloat(ovr.letterSpacing) || 0)
      : parseFloat(def.ls) || 0;

    dtcg.typography[step] = {
      $value: {
        fontFamily: step.startsWith("headline") ? "{typography.families.heading}" : "{typography.families.body}",
        fontSize: { value: ovr.fontSize ?? computedSize, unit: "px" },
        fontWeight: ovr.fontWeight ?? def.fw,
        lineHeight: ovr.lineHeight ?? def.lh,
        letterSpacing: { value: lsVal, unit: "em" }
      }
    };
  }

  /* 5. 參數化深度系統 (Elevation) */
  const elev = state.elevation || {};
  const elevLevelsObj = {};
  const levelsSource = elev.levels || {};

  for (let i = 1; i <= 5; i++) {
    const k = `level-${i}`;
    const lvl = levelsSource[k] || {};
    const lvlVal = lvl.$value || lvl;
    elevLevelsObj[k] = {
      $value: {
        offsetX: { value: lvlVal.offsetX?.value ?? lvlVal.offsetX ?? 0, unit: "px" },
        offsetY: { value: lvlVal.offsetY?.value ?? lvlVal.offsetY ?? i * 2, unit: "px" },
        blur:    { value: lvlVal.blur?.value ?? lvlVal.blur ?? i * 6, unit: "px" },
        spread:  { value: lvlVal.spread?.value ?? lvlVal.spread ?? 0, unit: "px" },
        opacity: lvlVal.opacity ?? 0.05
      }
    };
  }

  const borderStrat = shape.borderStrategy || "hairline";
  const bw = borderStrat === "none" ? 0 : (borderStrat === "bold" ? Math.max(2, shape.borderWidth ?? 2) : 1);

  Object.assign(dtcg.appearance, {
    elevation: {
      $description: "參數化深度系統。修改 strategy／intensity／tintColor 三者即可改變視覺風格，不需要寫死 levels 結構。",
      strategy: {
        $type: "string",
        $value: elev.strategy || "glass",
        $comment: "可選：material（緊湊不透明陰影）、glass（大擴散低不透明度＋邊框，可選 backdrop-blur）、flat（無陰影，靠底色分層）、glow（發光邊框與擴散，深色科技風）"
      },
      intensity: {
        $type: "number",
        $value: elev.intensity ?? 0.35,
        $comment: "設計深度強度係數 0~1，用來未來自適應調整 opacity 等級"
      },
      tintColor: {
        $type: "color",
        $value: elev.tintColor || (elev.strategy === "material" ? "#000000" : "{color.primary.900}"),
        $comment: "陰影色調。material 風建議用 #000000；glass／彌散風格建議用 primary 深色調而不純黑，避免髒髒的"
      },
      requiresBorder: {
        $type: "boolean",
        $value: elev.requiresBorder ?? (elev.strategy === "glass" || elev.strategy === "flat"),
        $comment: "glass 策略下通常搭配 1px 半透明邊緣，否則卡片會和背景糊在一起"
      },
      borderOpacity: {
        $type: "number",
        $value: elev.borderOpacity ?? 0.08
      },
      supportsBackdropBlur: {
        $type: "boolean",
        $value: elev.supportsBackdropBlur ?? (elev.strategy === "glass")
      },
      backdropBlur: {
        $type: "dimension",
        $value: { value: elev.backdropBlur ?? 20, unit: "px" }
      },
      levels: {
        $type: "shadow",
        ...elevLevelsObj
      }
    },
    shape: {
      $description: "形狀語言旋鈕。與 appearance.radius 搭配，決定圓角在不同元件層級如何套用。",
      cornerStrategy: {
        $type: "string",
        $value: cornerStrat,
        $comment: "可選：rounded-consistent（所有層級用等同圓角邏輯等比放大）、rounded-mixed（大容器圓、小元件較方，製造層次）、sharp（銳角直角，前衛藝術或工業調性）"
      },
      borderStrategy: {
        $type: "string",
        $value: borderStrat,
        $comment: "可選：none、hairline (0.5~1px 細邊框)、bold（≥2px 強調邊界）"
      },
      borderWidth: {
        $type: "dimension",
        $value: { value: bw, unit: "px" }
      },
      subcardBorderWidth: {
        $type: "dimension",
        $value: { value: state.shape?.subcardBorderWidth ?? 1, unit: "px" }
      }
    },
    component: {
      button: {
        radius: { $type: "dimension", $value: { value: state.components?.button?.radius ?? 8, unit: "px" } }
      },
      input: {
        radius: { $type: "dimension", $value: { value: state.components?.input?.radius ?? 8, unit: "px" } }
      },
      card: {
        padding: { $type: "dimension", $value: { value: state.components?.card?.padding ?? 24, unit: "px" } },
        radius: { $type: "dimension", $value: { value: state.components?.card?.radius ?? 16, unit: "px" } },
        elevation: { $type: "string", $value: state.components?.card?.elevation ? state.components.card.elevation.replace("{elevation.", "{appearance.elevation.") : "{appearance.elevation.levels.level-1}" }
      },
      subcard: {
        padding: { $type: "dimension", $value: { value: state.components?.subcard?.padding ?? 16, unit: "px" } },
        radius: { $type: "dimension", $value: { value: state.components?.subcard?.radius ?? 12, unit: "px" } }
      },
      checkboxRadio: {
        radius: { $type: "dimension", $value: { value: state.components?.checkboxRadio?.radius ?? 4, unit: "px" } }
      },
      slider: {
        radius: { $type: "dimension", $value: { value: state.components?.checkboxRadio?.radius ?? 4, unit: "px" } }
      }
    }
  });

  return dtcg;
}

  });

  define("./src/export/toFlatFormat.js", function(__require, exports) {
/**
 * Phase 2 規格預留：DTCG 巢狀格式 → Stitch 扁平格式轉換器（完全遵循 SPEC 第 11.5 節）
 * 
 * 格式對應範例：
 * { color: { primary: { 500: { $value: "#2563eb" } } } }
 * → { colors: { "primary-500": "#2563eb" } }
 * 
 * MVP 階段確保資料結構可無損降階，函式規格預留於此
 */
exports.toFlatFormat = toFlatFormat; function toFlatFormat(dtcg) {
  /* Phase 2 實作預留 */
  return dtcg;
}

  });

  define("./src/export/toYaml.js", function(__require, exports) {
/* 純原生 YAML 序列化工具（純函式，零依賴，完全遵循 SPEC 第 4 節與第 11.2 節） */

exports.toYaml = toYaml; function toYaml(obj, indent = 0) {
  const spaces = " ".repeat(indent);

  if (obj === null || typeof obj === "undefined") {
    return "null";
  }

  if (typeof obj === "boolean" || typeof obj === "number") {
    return String(obj);
  }

  if (typeof obj === "string") {
    /* 若字串包含冒號、換行或特殊字元，進行標準轉義或加引號 */
    if (obj.includes("\n")) {
      const lines = obj.split("\n").map(l => `${spaces}  ${l}`).join("\n");
      return `|\n${lines}`;
    }
    if (
      obj === "" ||
      /[:#{}[\]>&*?|<>=!%@`]/.test(obj) ||
      /^(true|false|null|yes|no)$/i.test(obj) ||
      !isNaN(Number(obj))
    ) {
      return JSON.stringify(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    /* 簡單陣列且項目均為短字串或數字時採行內陣列 */
    const allPrimitive = obj.every(x => typeof x === "string" || typeof x === "number");
    if (allPrimitive && obj.length <= 4) {
      return `[${obj.map(x => (typeof x === "string" ? JSON.stringify(x) : x)).join(", ")}]`;
    }
    return obj.map(item => `${spaces}- ${toYaml(item, indent + 2).trimStart()}`).join("\n");
  }

  if (typeof obj === "object") {
    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";

    return keys
      .map(key => {
        const val = obj[key];
        /* 數字開頭或含特殊符號的鍵名必須加引號 (SPEC 11.2) */
        const formattedKey = /^[0-9]/.test(key) || /[^a-zA-Z0-9_$-]/.test(key)
          ? JSON.stringify(key)
          : key;

        if (val !== null && typeof val === "object" && !Array.isArray(val) && Object.keys(val).length > 0) {
          return `${spaces}${formattedKey}:\n${toYaml(val, indent + 2)}`;
        } else if (Array.isArray(val) && val.length > 4) {
          return `${spaces}${formattedKey}:\n${toYaml(val, indent + 2)}`;
        } else {
          return `${spaces}${formattedKey}: ${toYaml(val, indent + 2)}`;
        }
      })
      .join("\n");
  }

  return String(obj);
}

  });

  define("./src/fonts/catalog.js", function(__require, exports) {
const { GOOGLE_FONTS_DATA } = __require("../data/googleFontsData.js");

/* 所有 Google Fonts（共 1,946 款，依 A-Z 升冪排序） */
const ALL_FONTS = exports.ALL_FONTS = GOOGLE_FONTS_DATA.allFonts;

/* Google Fonts 中文字型清單（共 32 款，依 A-Z 升冪排序） */
const CJK_FONTS = exports.CJK_FONTS = GOOGLE_FONTS_DATA.cjkFonts;

/* 保留相容性匯出 */
const CURATED_FONTS = exports.CURATED_FONTS = ALL_FONTS.map(f => ({ family: f }));


  });

  define("./src/fonts/loader.js", function(__require, exports) {
/**
 * Google Fonts 動態載入器（完全遵循 SPEC 第 8.5 節）
 * 快取已載入的 family:weights，避免重複請求
 */
const loadedSet = new Set();

exports.ensureFont = ensureFont; async function ensureFont(family, weights = [400, 500, 600, 700]) {
  if (!family || typeof document === "undefined") return;

  const sortedWeights = [...new Set(weights)].sort((a, b) => a - b);
  const key = `${family}:${sortedWeights.join(",")}`;
  if (loadedSet.has(key)) return;
  loadedSet.add(key);

  const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@${sortedWeights.join(";")}&display=swap`;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  } catch (err) {
    console.warn("Font loading wait failed:", err);
  }
}

  });

  define("./src/i18n/en.js", function(__require, exports) {
/* 英文語系字典（完全遵循 SPEC 第 12 節） */
const en = exports.en = {
  "topbar.title": "Design Token Builder",
  "topbar.export": "Export",
  "topbar.reset": "Reset",
  "topbar.fullscreen": "Fullscreen Preview",
  "topbar.reset.confirm.title": "Reset Design Tokens?",
  "topbar.reset.confirm.msg": "This will clear all customizations and restore system defaults.",
  "topbar.reset.confirm.ok": "Reset",
  "topbar.reset.confirm.cancel": "Cancel",

  "locale.zh": "Chinese",
  "locale.en": "English",
  "locale.all": "All",

  "tab.preview": "Preview",
  "tab.markdown": "Markdown",
  "tab.settings": "Settings",

  "action.done": "Done",
  "action.edit": "Edit",
  "action.add": "＋",
  "action.tweak": "Tweak",
  "action.reset": "Reset",
  "status.completed": "Completed",
  "status.tweaked": "Modified",
  "status.harmonized": "Harmonized",
  "status.tooLight": "Too light",
  "status.tooDark": "Too dark",

  "a11y.contrast.ok": "Contrast Check Passed",
  "a11y.contrast.passAaa": "Contrast Check Passed (AAA)",
  "a11y.contrast.passAa": "Contrast Check Passed (AA)",
  "a11y.contrast.fail": "Contrast Check Failed",
  "a11y.contrast.issues": "Contrast Check Failed",
  "a11y.contrast.checking": "Checking",
  "a11y.autofix": "Auto Fix",

  "panel.presets.title": "Style Presets",
  "panel.brand.title": "Project & Audience",
  "panel.colors.title": "Colors",
  "panel.typography.title": "Typography",
  "panel.layout.title": "Layout & Spacing",
  "panel.elevation.title": "Appearance",
  "panel.guidelines.title": "Guidelines",

  "brand.productName": "Product Name",
  "brand.productName.ph": "e.g. Aurora Cloud Architecture Platform",
  "brand.positioning": "One-line Positioning",
  "brand.positioning.ph": "e.g. Actionable insights for SMBs.",
  "brand.audience": "Target Audience",
  "brand.audience.ph": "Describe target users, primary context and key challenges...",
  "brand.moodKeywords": "Mood Keywords (Press Enter)",
  "brand.avoidKeywords": "Feelings to Avoid (Press Enter)",

  "colors.primaries": "Primary Colors (Max 3)",
  "colors.neutral": "Neutral Color (Max 1)",
  "colors.accents": "Accent Colors (Max 6)",
  "colors.semantic": "Status",
  "colors.semantic.success": "Success",
  "colors.semantic.warning": "Warning",
  "colors.semantic.error": "Error",
  "colors.semantic.info": "Info",
  "colors.surfaceOverride": "Enable Surface Colors Override",
  "colors.surfaceOverride.light": "Light Mode",
  "colors.surfaceOverride.dark": "Dark Mode",
  "colors.surfaceOverride.system": "System",
  "colors.surface.bg": "Background",
  "colors.surface.surface": "Surface",
  "colors.surface.btnSecondaryBg": "Secondary",
  "colors.surface.btnInvertedBg": "Inverted",
  "colors.surface.text": "Text",
  "colors.surface.border": "Border",

  "colors.link": "Link Color (Max 1)",
  "typography.engFont": "English Fonts",
  "typography.headingFont": "Title",
  "typography.bodyFont": "Body",
  "typography.monoFont": "Label",
  "typography.cjkFont": "Chinese Fonts",
  "typography.searchPlaceholder": "Search fonts...",
  "typography.noResult": "No fonts found",
  "typography.baseSize": "Base Font Size (px)",
  "typography.ratio": "Scale Ratio",
  "typography.cjkRules": "CJK Typography Adjustments",
  "typography.lineHeightBoost": "CJK line height boost",
  "typography.autoSpacing": "Auto spacing",
  "typography.punctuationCompression": "Punctuation compression",
  "typography.noSyntheticItalic": "No synthetic italic",
  "typography.fontSize": "Font Size (px)",
  "typography.fontWeight": "Font Weight",
  "typography.lineHeight": "Line Height",
  "typography.letterSpacing": "Letter Spacing (em)",

  "layout.spacingBase": "Base Spacing Unit (px)",
  "layout.spacingScale": "Spacing Scale",
  "layout.scaleLinear": "Linear",
  "layout.scaleGeometric": "Exponential",
  "layout.maxWidth": "Max Content Width (px)",
  "layout.columns": "Grid Columns",
  "layout.columnsUnit": "{count} Columns",
  "layout.gutter": "Gutter Width (px)",

  "elevation.strategy": "Elevation Strategy",
  "elevation.strategy.glass": "Glass (Translucent)",
  "elevation.strategy.soft": "Soft (Natural soft shadow)",
  "elevation.strategy.flat": "Flat (No shadow)",
  "elevation.strategy.crisp": "Crisp (Classic material shadow)",
  "elevation.strategy.brutal": "Brutal (Neo-brutalism solid shadow)",
  "elevation.intensity": "Depth Intensity (0–1)",
  "elevation.tintColor": "Shadow Tint Mode",
  "elevation.tintColor.auto": "Smart Default (Auto-linked to strategy)",
  "elevation.tintColor.primary": "Brand Dark Tint",
  "elevation.tintColor.black": "Neutral Pure Black",
  "elevation.requiresBorder": "Combine with Border",
  "elevation.backdropBlur": "Backdrop Blur (px)",
  "elevation.levels": "Number of Levels (2–5)",
  "shape.cornerStrategy": "Corner Radius Strategy",
  "shape.cornerStrategy.consistent": "Proportional",
  "shape.cornerStrategy.mixed": "Large Rounded, Small Square",
  "shape.cornerStrategy.sharp": "Sharp Rectangular",
  "shape.radiusBase": "Base Radius (px)",
  "shape.radiusScale": "Radius Scale",
  "shape.borderStrategy": "Border Style Strategy",
  "shape.borderStrategy.hairline": "Hairline (1px)",
  "shape.borderStrategy.bold": "Bold (2px+)",
  "shape.borderStrategy.none": "No Border",
  "shape.borderWidth": "Border (px)",
  "shape.borderStyle": "Border Style",

  "components.buttonSection": "Button Style",
  "components.btnSize": "Button Size",
  "components.btnPadding": "Button Padding (Horizontal / Vertical)",
  "components.btnRadius": "Button Radius Level",
  "components.inputSection": "Input Style",
  "components.inputPadding": "Input Padding (Horizontal / Vertical)",
  "components.inputRadius": "Input Radius Level",
  "components.cardSection": "Card Style",
  "components.cardPadding": "Card",
  "components.subcardPadding": "Sub-card",
  "components.modalPadding": "Modal",
  "components.buttonPadding": "Button",
  "components.inputPadding2": "Input",
  "components.paddingSection": "Padding (px)",
  "components.cardRadius": "Card Radius Level",
  "components.cardElevation": "Card Elevation Level",
  "components.switchSection": "Switch & Toggle",
  "components.switchSize": "Switch Size",
  "components.switchBorder": "Track Subtle Border",
  "components.tabsSection": "Segmented Control & Tabs",
  "components.tabsStyle": "Tabs Style",
  "components.tabsStyle.segmented": "Segmented Pill",
  "components.tabsStyle.underline": "Bottom Underline",
  "components.tabsRadius": "Tabs Radius Level",
  "components.checkRadioSection": "Checkbox & Radio",
  "components.checkRadioSize": "Control Size",
  "components.checkRadius": "Checkbox Radius",
  "components.modalSection": "Dialog Modal & Drawer",
  "components.card": "Card",
  "components.subcard": "Sub-card",
  "components.modal": "Modal",
  "components.button": "Button",
  "components.input": "Input",
  "components.controls": "Controls",
  "components.backdropBlurPx": "Modal (Backdrop)",
  "components.modalRadius": "Modal Radius",
  "components.modalBackdropBlur": "Backdrop Blur",
  "components.radiusHierarchy": "Radius (px)",
  "components.blurLevel": "Blur (px)",
  "components.size.sm": "Small (SM)",
  "components.size.md": "Medium (MD)",
  "components.size.lg": "Large (LG)",
  "components.level": "Level {lvl}",
  "components.radius.none": "None",
  "components.radius.sm": "SM",
  "components.radius.md": "MD",
  "components.radius.lg": "LG",
  "components.radius.xl": "XL",
  "components.radius.full": "Full",
  "components.placeholderX": "X",
  "components.placeholderY": "Y",

  "guidelines.dos": "Do's (Recommended, max 8)",
  "guidelines.donts": "Don'ts (Avoid, max 8)"
};

  });

  define("./src/i18n/index.js", function(__require, exports) {
/* 國際化模組進入點（完全遵循 SPEC 第 12 節） */
const { zhTW } = __require("./zh-TW.js");
const { en } = __require("./en.js");

let currentLocale = "zh-TW";
let dict = zhTW;

exports.setLocale = setLocale; function setLocale(locale) {
  currentLocale = locale;
  if (locale === "en") {
    dict = en;
  } else if (locale === "all") {
    dict = null;
  } else {
    currentLocale = "zh-TW";
    dict = zhTW;
  }
}

exports.getLocale = getLocale; function getLocale() {
  return currentLocale;
}

exports.t = t; function t(key, vars = {}) {
  let str;
  if (currentLocale === "all") {
    const zhVal = zhTW[key] || key;
    const enVal = en[key] || key;
    str = zhVal === enVal ? zhVal : `${zhVal} / ${enVal}`;
  } else {
    str = (dict ? dict[key] : null) || zhTW[key] || key;
  }
  if (vars && typeof vars === "object") {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return str;
}

  });

  define("./src/i18n/zh-TW.js", function(__require, exports) {
/* 繁體中文語系字典（完全遵循 SPEC 第 12 節，全中文且全形標點） */
const zhTW = exports.zhTW = {
  "topbar.title": "設計 Token 建構器",
  "topbar.export": "匯出",
  "topbar.reset": "重設",
  "topbar.fullscreen": "全螢幕預覽",
  "topbar.reset.confirm.title": "確認重設設計 Token？",
  "topbar.reset.confirm.msg": "這將清除所有自訂參數與標記，並還原至系統預設狀態。",
  "topbar.reset.confirm.ok": "確認重設",
  "topbar.reset.confirm.cancel": "取消",

  "locale.zh": "中文",
  "locale.en": "英文",
  "locale.all": "全部",

  "tab.preview": "預覽",
  "tab.markdown": "標記文件",
  "tab.settings": "設定",

  "action.done": "完成",
  "action.edit": "編輯",
  "action.add": "＋",
  "action.tweak": "微調",
  "action.reset": "還原",
  "status.completed": "完成",
  "status.tweaked": "已微調",
  "status.harmonized": "已調和",
  "status.tooLight": "偏亮",
  "status.tooDark": "偏暗",

  "a11y.contrast.ok": "對比度通過",
  "a11y.contrast.passAaa": "對比度檢查通過 (AAA級)",
  "a11y.contrast.passAa": "對比度檢查通過 (AA級)",
  "a11y.contrast.fail": "對比度檢查不通過",
  "a11y.contrast.issues": "對比度檢查不通過",
  "a11y.contrast.checking": "檢查中",
  "a11y.autofix": "自動修正",

  "panel.presets.title": "風格預設集",
  "panel.brand.title": "專案與受眾",
  "panel.colors.title": "色彩",
  "panel.typography.title": "字體",
  "panel.layout.title": "版面",
  "panel.elevation.title": "外觀",
  "panel.guidelines.title": "設計準則",

  "brand.productName": "產品名稱",
  "brand.productName.ph": "例如：極光雲端架構平台",
  "brand.positioning": "一句話定位",
  "brand.positioning.ph": "例如：讓中小企業看懂自己的數據。",
  "brand.audience": "目標受眾",
  "brand.audience.ph": "描述主要使用者特徵、使用場景與核心痛點……",
  "brand.moodKeywords": "情緒關鍵字（輸入後新增）",
  "brand.avoidKeywords": "避免的感覺（輸入後新增）",

  "colors.primaries": "主要（最多 3 個）",
  "colors.accents": "輔助（最多 6 個）",
  "colors.neutral": "中性（最多 1 個）",
  "colors.semantic": "狀態",
  "colors.semantic.success": "成功",
  "colors.semantic.warning": "警告",
  "colors.semantic.error": "錯誤",
  "colors.semantic.info": "資訊",
  "colors.surfaceOverride": "啟用自訂介面色彩",
  "colors.surfaceOverride.light": "淺色模式",
  "colors.surfaceOverride.dark": "深色模式",
  "colors.surfaceOverride.system": "系統",
  "colors.surface.bg": "背景",
  "colors.surface.surface": "卡片",
  "colors.surface.btnSecondaryBg": "次要",
  "colors.surface.btnInvertedBg": "反轉",
  "colors.surface.text": "文字",
  "colors.surface.border": "邊框",

  "colors.link": "連結（最多 1 個）",
  "typography.engFont": "英文字型",
  "typography.headingFont": "標題",
  "typography.bodyFont": "內文",
  "typography.monoFont": "標籤",
  "typography.cjkFont": "中文字型",
  "typography.searchPlaceholder": "搜尋字型...",
  "typography.noResult": "查無字型",
  "typography.baseSize": "基準字級 (px)",
  "typography.ratio": "尺度比例",
  "typography.cjkRules": "繁中排版微調",
  "typography.lineHeightBoost": "中文行高加成",
  "typography.autoSpacing": "中英數自動空白",
  "typography.punctuationCompression": "標點壓縮",
  "typography.noSyntheticItalic": "不使用傾斜中文",
  "typography.fontSize": "字級 (px)",
  "typography.fontWeight": "字重",
  "typography.lineHeight": "行高",
  "typography.letterSpacing": "字距 (em)",

  "layout.spacingBase": "間距基準（像素）",
  "layout.spacingScale": "間距尺度模式",
  "layout.scaleLinear": "線性",
  "layout.scaleGeometric": "指數",
  "layout.maxWidth": "最大內容寬度（像素）",
  "layout.columns": "網格欄數",
  "layout.columnsUnit": "{count} 欄",
  "layout.gutter": "欄間距（像素）",

  "elevation.strategy": "陰影風格",
  "elevation.strategy.flat": "無陰影 (Flat)",
  "elevation.strategy.soft": "自然柔和 (Soft)",
  "elevation.strategy.crisp": "經典立體 (Crisp)",
  "elevation.strategy.glass": "毛玻璃 (Glass)",
  "elevation.strategy.brutal": "新粗野主義 (Brutal)",
  "elevation.intensity": "深度強度（0 至 1）",
  "elevation.tintColor": "陰影色調模式",
  "elevation.tintColor.auto": "智慧預設（依策略自動連動）",
  "elevation.tintColor.primary": "品牌深色調",
  "elevation.tintColor.black": "中性純黑",
  "elevation.requiresBorder": "搭配邊框",
  "elevation.backdropBlur": "毛玻璃模糊（像素）",
  "elevation.levels": "層級數量（2 至 5 階）",
  "shape.cornerStrategy": "形狀圓角策略",
  "shape.cornerStrategy.consistent": "等比放大",
  "shape.cornerStrategy.mixed": "大圓小方",
  "shape.cornerStrategy.sharp": "銳利直角",
  "shape.radiusBase": "圓角基準（像素）",
  "shape.radiusScale": "圓角模式",
  "shape.borderStrategy": "邊框樣式策略",
  "shape.borderStrategy.hairline": "極細邊框（1 像素）",
  "shape.borderStrategy.bold": "強調邊框（2 像素以上）",
  "shape.borderStrategy.none": "無邊框",
  "shape.borderWidth": "邊框（像素）",
  "shape.borderStyle": "邊框樣式",

  "components.buttonSection": "按鈕元件樣式",
  "components.btnSize": "按鈕尺寸",
  "components.btnPadding": "按鈕內距（水平／垂直）",
  "components.btnRadius": "按鈕圓角層級",
  "components.inputSection": "輸入框樣式",
  "components.inputPadding": "輸入框內距（水平／垂直）",
  "components.inputRadius": "輸入框圓角層級",
  "components.cardSection": "卡片樣式",
  "components.cardPadding": "卡片",
  "components.subcardPadding": "子卡片",
  "components.modalPadding": "彈出視窗",
  "components.buttonPadding": "按鈕",
  "components.inputPadding2": "輸入框",
  "components.paddingSection": "內距（像素）",
  "components.cardRadius": "卡片圓角層級",
  "components.cardElevation": "卡片陰影層級",
  "components.switchSection": "開關與切換器",
  "components.switchSize": "開關尺寸",
  "components.switchBorder": "顯示軌道細邊框",
  "components.tabsSection": "分段控制器與分頁",
  "components.tabsStyle": "分頁樣式",
  "components.tabsStyle.segmented": "分段膠囊 (Segmented)",
  "components.tabsStyle.underline": "底部分隔線 (Underline)",
  "components.tabsRadius": "分段圓角層級",
  "components.checkRadioSection": "核取方塊與單選框",
  "components.checkRadioSize": "控制項尺寸",
  "components.checkRadius": "核取方塊圓角",
  "components.modalSection": "彈出視窗與抽屜",
  "components.card": "卡片",
  "components.subcard": "子卡片",
  "components.modal": "彈出視窗",
  "components.button": "按鈕",
  "components.input": "輸入框",
  "components.controls": "控制項",
  "components.backdropBlurPx": "彈出視窗（背景）",
  "components.modalRadius": "彈出視窗圓角層級",
  "components.modalBackdropBlur": "背景毛玻璃模糊",
  "components.radiusHierarchy": "圓角（像素）",
  "components.blurLevel": "模糊（像素）",
  "components.size.sm": "小 (SM)",
  "components.size.md": "中 (MD)",
  "components.size.lg": "大 (LG)",
  "components.level": "層級 {lvl}",
  "components.radius.none": "無圓角",
  "components.radius.sm": "小",
  "components.radius.md": "中",
  "components.radius.lg": "大",
  "components.radius.xl": "特大",
  "components.radius.full": "全圓",
  "components.placeholderX": "水平",
  "components.placeholderY": "垂直",

  "guidelines.dos": "建議做法（最多 8 條）",
  "guidelines.donts": "避免做法（最多 8 條）"
};

  });

  define("./src/main.js", function(__require, exports) {
/* 系統主進入點（完全遵循 SPEC 第 3、4、9、13、14 節） */
const { createStore } = __require("./core/store.js");
const { reducer } = __require("./core/reducer.js");
const { defaultState } = __require("./core/defaultState.js");
const { setTab, setLocale, setPreviewMode, setLeftWidth, resetAll, hydrate, patch } = __require("./core/actions.js");
const { createRafBatcher, debounce, scheduleIdle } = __require("./core/schedule.js");
const { deriveTokens } = __require("./tokens/derive.js");
const { applyTokens } = __require("./tokens/apply.js");
const { initPreviewRoot, createLoadingIndicator, toggleFullscreen } = __require("./preview/previewRoot.js");
const { encodeState, decodeState } = __require("./url/codec.js");
const { t, setLocale: setI18nLocale } = __require("./i18n/index.js");
const { STORAGE_KEY, SCHEMA_VERSION } = __require("./config.js");
const { runA11yAudit, fixA11yIssues } = __require("./a11y/audit.js");

/* 各設定區塊元件 */
const { createColorsPanel } = __require("./panels/p2Colors.js");
const { createTypographyPanel } = __require("./panels/p3Typography.js");
const { createElevationShapePanel } = __require("./panels/p5ElevationShape.js");
const { stateToDtcg } = __require("./export/toDtcg.js");

async function init() {
  /* 1. 決定初始狀態優先序 (SPEC 13.2) */
  let initial = defaultState;

  /* 優先序 1: URL #c= */
  const hash = window.location.hash;
  if (hash.startsWith("#c=")) {
    const encoded = hash.slice(3);
    const decoded = await decodeState(encoded);
    if (decoded && decoded.meta?.schemaVersion === SCHEMA_VERSION) {
      initial = {
        ...defaultState,
        ...decoded,
        ui: { ...defaultState.ui }
      };
      /* 清除 hash */
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  } else {
    /* 優先序 2: localStorage */
    try {
      /* 清除舊版本 localStorage 快取，防止舊版 2 個輔助色或舊調色覆寫新設定 */
      ["byds:state:v1", "byds:state:v2", "byds:state:v3", "byds:state:v4", "byds:state:v5"].forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.meta?.schemaVersion === SCHEMA_VERSION) {
          initial = {
            ...defaultState,
            ...parsed,
            colors: {
              ...defaultState.colors,
              ...(parsed.colors || {}),
              link: parsed.colors?.link || defaultState.colors.link,
              accents: (Array.isArray(parsed.colors?.accents) && parsed.colors.accents.length >= 6)
                ? parsed.colors.accents
                : defaultState.colors.accents
            },
            typography: {
              ...defaultState.typography,
              ...(parsed.typography || {}),
              families: {
                ...defaultState.typography.families,
                ...(parsed.typography?.families || {})
              }
            },
            ui: {
              ...defaultState.ui,
              ...(parsed.ui || {}),
              leftPanelWidth: 200, /* 強制覆寫為 200px */
              panels: {
                ...defaultState.ui.panels,
                ...(parsed.ui?.panels || {})
              }
            }
          };
        }
      }
    } catch (e) {
      console.warn("localStorage read failed, using defaultState", e);
    }
  }

  /* 決定預覽主題模式：使用者最後手動切換的模式優先，否則依據使用者作業系統/瀏覽器的顯示模式 */
  const THEME_STORAGE_KEY = "byds:theme_mode";
  const savedThemeMode = localStorage.getItem(THEME_STORAGE_KEY);
  const browserPreferredMode = (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  const effectiveThemeMode = savedThemeMode || browserPreferredMode;

  initial = {
    ...initial,
    meta: {
      ...initial.meta,
      previewMode: effectiveThemeMode
    }
  };

  /* 初始化語系 */
  setI18nLocale(initial.meta.locale || "zh-TW");

  /* 2. 建立 Store */
  const store = createStore(reducer, initial);

  /* 3. DOM 節點快取 */
  const topbarTitleEl = document.getElementById("topbar-title");
  const themeTabs = document.getElementById("theme-tabs");
  const fullscreenToggle = document.getElementById("fullscreen-toggle");
  const localeTabs = document.getElementById("locale-tabs");
  const resetBtn = document.getElementById("reset-btn");
  const exportJsonBtn = document.getElementById("export-json-btn");

  const leftPanelEl = document.getElementById("left-panel");
  const mainStageEl = document.getElementById("main-stage");
  const previewRootEl = document.getElementById("preview-root");
  const previewLoadingEl = document.getElementById("preview-loading");

  const mobileTabSettings = document.getElementById("mobile-tab-settings");
  const mobileTabPreview = document.getElementById("mobile-tab-preview");

  const resetDialog = document.getElementById("reset-dialog");
  const resetConfirmBtn = document.getElementById("reset-confirm-btn");
  const resetCancelBtn = document.getElementById("reset-cancel-btn");
  const devActionsSlot = document.getElementById("dev-actions-slot");

  /**
   * 4. 初始化預覽 DOM (SPEC 3.2 Rule 1: 僅建立一次，後續永不重建)
   * 5. 右側預覽區初始化
   */
  const preview = initPreviewRoot(previewRootEl, store);
  const loadingIndicator = createLoadingIndicator(previewLoadingEl);

  /* 5. 掛載設定區塊 */
  const panelsSlot = document.getElementById("panels-slot");

  const panels = [
    createColorsPanel(store),
    createTypographyPanel(store),
    createElevationShapePanel(store)
  ];

  panels.forEach(p => panelsSlot.appendChild(p.block));

  /* 6. Token 注入排程器 (以 rAF 合併同一幀內的多次 dispatch) */
  const batchApplyTokens = createRafBatcher((state) => {
    loadingIndicator.start();
    const { tokenMap } = deriveTokens(state);
    applyTokens(previewRootEl, tokenMap);
    previewRootEl.setAttribute("data-mode", state.meta.previewMode);
    previewRootEl.setAttribute("data-locale", state.meta.locale);
    loadingIndicator.end();
  });

  /* 8. localStorage 寫入排程器 (Debounce 500ms, SPEC 13.1) */
  const saveStateDebounced = debounce((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("localStorage save failed", e);
    }
  }, 500);

  /* 對比度狀態更新器（支援 AA 與 AAA 等級評判，即時響應語言與模式） */
  function updateA11yBadge(state) {
    const a11yBadgeEl = document.getElementById("a11y-badge");
    const a11yBadgeTextEl = document.getElementById("a11y-badge-text");
    const a11yFixBtnEl = document.getElementById("a11y-fix-btn");

    if (!a11yBadgeEl || !a11yBadgeTextEl) return;

    const audit = runA11yAudit(state, state.meta.previewMode);

    if (audit.level === "AAA") {
      a11yBadgeEl.className = "a11y-badge pass pass-aaa";
      a11yBadgeTextEl.textContent = t("a11y.contrast.passAaa") || "Contrast Passed (AAA)";
      if (a11yFixBtnEl) {
        a11yFixBtnEl.style.display = "none";
        a11yFixBtnEl.textContent = t("a11y.autofix");
      }
    } else if (audit.level === "AA") {
      a11yBadgeEl.className = "a11y-badge pass";
      a11yBadgeTextEl.textContent = t("a11y.contrast.passAa") || "Contrast Passed (AA)";
      if (a11yFixBtnEl) {
        a11yFixBtnEl.style.display = "none";
        a11yFixBtnEl.textContent = t("a11y.autofix");
      }
    } else {
      a11yBadgeEl.className = "a11y-badge fail";
      a11yBadgeTextEl.textContent = t("a11y.contrast.fail") || "Contrast Failed";
      if (a11yFixBtnEl) {
        a11yFixBtnEl.style.display = "inline-block";
        a11yFixBtnEl.textContent = t("a11y.autofix");
      }
    }
  }

  /* 10. 全域 Store 訂閱器 */
  store.subscribe((state, action) => {
    /* 同步 i18n 模組語系 */
    setI18nLocale(state.meta.locale || "zh-TW");

    /* A. 注入 Token */
    batchApplyTokens(state);

    /* C. 持久化 */
    saveStateDebounced(state);

    /* D. 同步各子面板與預覽 */
    panels.forEach(p => p.update(state));
    if (preview && preview.update) preview.update(state);

    /* E. 同步 UI 控制項狀態 */
    if (leftPanelEl) {
      leftPanelEl.style.width = `${state.ui.leftPanelWidth}px`;
    }

    /* 更新預覽容器屬性 */
    if (previewRootEl) {
      previewRootEl.setAttribute("data-mode", state.meta.previewMode);
      previewRootEl.setAttribute("data-locale", state.meta.locale);
    }

    /* 預覽模式按鈕狀態 */
    Array.from(themeTabs.children).forEach(btn => {
      if (btn.dataset.theme === state.meta.previewMode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    /* 語言按鈕狀態與文字 */
    Array.from(localeTabs.children).forEach(btn => {
      const btnLocale = (btn.dataset.locale || "").toLowerCase();
      const stateLocale = (state.meta.locale || "").toLowerCase();
      if (btnLocale === stateLocale) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    /* 頂端列文字（隨語言切換） */
    topbarTitleEl.textContent = t("topbar.title");
    document.title = t("topbar.title") || "Design Token Builder";
    resetBtn.textContent = t("topbar.reset");
    exportJsonBtn.textContent = t("topbar.export");
    mobileTabSettings.textContent = t("tab.settings");
    mobileTabPreview.textContent = t("tab.preview");
    fullscreenToggle.title = t("topbar.fullscreen");

    const lightThemeBtn = themeTabs.querySelector('[data-theme="light"]');
    const darkThemeBtn = themeTabs.querySelector('[data-theme="dark"]');
    if (lightThemeBtn) lightThemeBtn.title = t("colors.surfaceOverride.light");
    if (darkThemeBtn) darkThemeBtn.title = t("colors.surfaceOverride.dark");

    /* 對比度檢查結果徽章更新 (Item 14 - 支援 AA / AAA 級檢測) */
    updateA11yBadge(state);

    /* 重設對話框多語 */
    const resetDialogTitle = document.getElementById("reset-dialog-title");
    const resetDialogMsg = document.getElementById("reset-dialog-msg");
    if (resetDialogTitle) resetDialogTitle.textContent = t("topbar.reset.confirm.title");
    if (resetDialogMsg) resetDialogMsg.textContent = t("topbar.reset.confirm.msg");
    if (resetCancelBtn) resetCancelBtn.textContent = t("topbar.reset.confirm.cancel");
    if (resetConfirmBtn) resetConfirmBtn.textContent = t("topbar.reset.confirm.ok");
  });

  /* 語言切換 (Item 1: 僅套用在預覽區塊，頂端列與左側調整區塊皆使用中文) */
  localeTabs.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target || !target.dataset.locale) return;
    const nextLocale = target.dataset.locale; /* Either "zh-TW" or "en" */

    /* 同步更新 i18n 模組（讓 panels 的 t() 呼叫能正確切換語言） */
    setI18nLocale(nextLocale);

    /* 立即更新按鈕的 active 狀態（不依賴 subscribe 延遲） */
    Array.from(localeTabs.children).forEach(btn => {
      if (btn.dataset.locale === nextLocale) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    store.dispatch(setLocale(nextLocale));
  });

  /* 對比度自動修正按鈕 (Item 14) */
  const a11yFixBtn = document.getElementById("a11y-fix-btn");
  if (a11yFixBtn) {
    a11yFixBtn.addEventListener("click", () => {
      const state = store.getState();
      const fixedState = fixA11yIssues(state);
      store.dispatch(hydrate(fixedState));
    });
  }

  /* 預覽模式切換 (Light / Dark - 記憶使用者選擇) */
  themeTabs.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target || !target.dataset.theme) return;
    const nextTheme = target.dataset.theme;
    
    /* 立即更新按鈕的 active 狀態 */
    Array.from(themeTabs.children).forEach(btn => {
      if (btn.dataset.theme === nextTheme) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    try {
      localStorage.setItem("byds:theme_mode", nextTheme);
    } catch (err) {
      console.warn("Save theme preference failed", err);
    }
    store.dispatch(setPreviewMode(nextTheme));
  });

  /* 全螢幕切換 (SPEC 9.6) */
  fullscreenToggle.addEventListener("click", () => {
    toggleFullscreen(previewRootEl);
  });

  /* 重設對話框 (SPEC 9.2) */
  resetBtn.addEventListener("click", () => resetDialog.showModal());
  resetCancelBtn.addEventListener("click", () => resetDialog.close());
  resetConfirmBtn.addEventListener("click", () => {
    store.dispatch(resetAll());
    window.dispatchEvent(new Event('app:reset'));
    resetDialog.close();
  });

  /* 匯出 JSON（產生標準 W3C DTCG 規格之 design-tokens.json） */
  exportJsonBtn.addEventListener("click", () => {
    const state = store.getState();
    const dtcg = stateToDtcg(state);
    const jsonContent = JSON.stringify(dtcg, null, 2);
    downloadFile("design-tokens.json", jsonContent, "application/json;charset=utf-8");
  });

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* 12. 分隔線拖拉 (已完全移除) */

  /* 13. 行動版分頁列切換 (< 1024px, SPEC 9.5) */
  mobileTabSettings.addEventListener("click", () => {
    mobileTabSettings.classList.add("active");
    mobileTabPreview.classList.remove("active");
    leftPanelEl.classList.add("mobile-active");
    mainStageEl.classList.remove("mobile-active");
  });

  mobileTabPreview.addEventListener("click", () => {
    mobileTabPreview.classList.add("active");
    mobileTabSettings.classList.remove("active");
    leftPanelEl.classList.remove("mobile-active");
    mainStageEl.classList.add("mobile-active");
  });

  /* 14. 開發者模式 Export as Preset (SPEC 2.4: 網址 ?dev=1 時才渲染) */
  if (window.location.search.includes("dev=1")) {
    const devBtn = document.createElement("button");
    devBtn.className = "panel-action-btn";
    devBtn.textContent = "Export as Preset";
    devBtn.style.color = "var(--app-warning)";
    devBtn.style.borderColor = "var(--app-warning)";

    devBtn.addEventListener("click", () => {
      const state = store.getState();
      const snippet = JSON.stringify(state, null, 2);
      navigator.clipboard.writeText(snippet).then(() => {
        alert("已將 AppState 複製到剪貼簿，可直接貼回 presets.js！");
      });
    });

    devActionsSlot.appendChild(devBtn);
  }

  /* 同步初始化 UI 狀態 */
  function syncUIControls(state) {
    if (themeTabs) {
      Array.from(themeTabs.children).forEach(btn => {
        if (btn.dataset.theme === state.meta.previewMode) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }
    if (localeTabs) {
      Array.from(localeTabs.children).forEach(btn => {
        const btnLocale = (btn.dataset.locale || "").toLowerCase();
        const stateLocale = (state.meta.locale || "").toLowerCase();
        if (btnLocale === stateLocale) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }

    /* 同步頂端列文字 */
    if (topbarTitleEl) topbarTitleEl.textContent = t("topbar.title");
    document.title = t("topbar.title") || "Design Token Builder";
    if (resetBtn) resetBtn.textContent = t("topbar.reset");
    if (exportJsonBtn) exportJsonBtn.textContent = t("topbar.export");
    if (mobileTabSettings) mobileTabSettings.textContent = t("tab.settings");
    if (mobileTabPreview) mobileTabPreview.textContent = t("tab.preview");
    if (fullscreenToggle) fullscreenToggle.title = t("topbar.fullscreen");

    const lightThemeBtn = themeTabs ? themeTabs.querySelector('[data-theme="light"]') : null;
    const darkThemeBtn = themeTabs ? themeTabs.querySelector('[data-theme="dark"]') : null;
    if (lightThemeBtn) lightThemeBtn.title = t("colors.surfaceOverride.light");
    if (darkThemeBtn) darkThemeBtn.title = t("colors.surfaceOverride.dark");
  }

  /* 首次觸發 Token 注入與無障礙狀態更新 */
  batchApplyTokens(store.getState());
  if (preview && preview.update) preview.update(store.getState());
  leftPanelEl.style.width = `${store.getState().ui.leftPanelWidth}px`;
  updateA11yBadge(store.getState());
  syncUIControls(store.getState());
}

/* 頁面載入完成啟動 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

  });

  define("./src/panels/p2Colors.js", function(__require, exports) {
/* 設定區塊 2：色彩（完全遵循 SPEC 第 5.1、6.5 與第 9.3.3 節） */
const { createPanelBlock } = __require("./panelBase.js");
const { patch, addColor, removeColor } = __require("../core/actions.js");
const { t } = __require("../i18n/index.js");

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

exports.createColorsPanel = createColorsPanel; function createColorsPanel(store) {
  let primariesContainer, accentsContainer, neutralContainer, linkContainer, semanticContainer, surfaceContainer;

  function updateColorItem(row, colorObj, canDelete = true) {
    if (!row || !row._refs) return;
    const { bubble, nativePicker, hexInput, delBtn } = row._refs;
    const seed = colorObj.seed || "#000000";
    bubble.style.backgroundColor = seed;
    if (document.activeElement !== nativePicker && HEX_REGEX.test(seed)) {
      nativePicker.value = seed.toLowerCase();
    }
    if (document.activeElement !== hexInput) {
      hexInput.value = seed.toUpperCase();
      hexInput.classList.remove("error");
    }
    if (delBtn) {
      delBtn.style.display = canDelete ? "inline-flex" : "none";
      delBtn.disabled = !canDelete;
    }
  }

  function renderColorItem(colorObj, onColorChange, onDelete, canDelete = true, isNeutral = false) {
    const row = document.createElement("div");
    row.className = "color-item-row";

    /* 顏色選擇氣泡 */
    const bubble = document.createElement("div");
    bubble.className = "color-picker-bubble";
    bubble.style.backgroundColor = colorObj.seed;

    const nativePicker = document.createElement("input");
    nativePicker.type = "color";
    nativePicker.value = HEX_REGEX.test(colorObj.seed) ? colorObj.seed.toLowerCase() : "#000000";
    nativePicker.addEventListener("input", (e) => {
      const val = e.target.value.toUpperCase();
      bubble.style.backgroundColor = val;
      hexInput.value = val;
      hexInput.classList.remove("error");
      onColorChange(val);
    });
    bubble.appendChild(nativePicker);

    /* 16 進位文字輸入 */
    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.className = "color-hex-input";
    hexInput.maxLength = 7;
    hexInput.value = colorObj.seed ? colorObj.seed.toUpperCase() : "";
    hexInput.addEventListener("input", (e) => {
      const val = e.target.value.trim().toUpperCase();
      if (HEX_REGEX.test(val)) {
        hexInput.classList.remove("error");
        bubble.style.backgroundColor = val;
        nativePicker.value = val.toLowerCase();
        onColorChange(val);
      }
    });
    hexInput.addEventListener("change", (e) => {
      const val = e.target.value.trim().toUpperCase();
      if (HEX_REGEX.test(val)) {
        hexInput.classList.remove("error");
        bubble.style.backgroundColor = val;
        nativePicker.value = val.toLowerCase();
        onColorChange(val);
      } else {
        hexInput.classList.add("error");
      }
    });

    row.appendChild(bubble);
    row.appendChild(hexInput);

    let delBtn = null;
    if (onDelete) {
      delBtn = document.createElement("button");
      delBtn.className = "color-delete-btn";
      delBtn.type = "button";
      delBtn.textContent = "✕";
      delBtn.style.display = canDelete ? "inline-flex" : "none";
      delBtn.disabled = !canDelete;
      delBtn.addEventListener("click", () => onDelete(colorObj.id));
      row.appendChild(delBtn);
    }

    row._refs = {
      bubble,
      nativePicker,
      hexInput,
      delBtn
    };

    return row;
  }

  let priLabel, priAddBtn, accLabel, accAddBtn, neuLabel, linkLabel, semLabel;

  const block = createPanelBlock({
    id: "colors",
    titleKey: "panel.colors.title",
    store,
    renderContent(container, store) {
      /* 1. 主要色 (最多 3 個) */
      const priGroup = document.createElement("div");
      priGroup.className = "ctrl-row";
      const priHeader = document.createElement("div");
      priHeader.style.display = "flex";
      priHeader.style.justifyContent = "space-between";
      priHeader.style.alignItems = "center";
      priHeader.style.gridColumn = "span 2";

      priLabel = document.createElement("label");
      priLabel.className = "ctrl-label";
      priLabel.style.color = "#ffffff";
      priLabel.style.fontWeight = "600";
      priLabel.style.fontSize = "13px";
      priLabel.textContent = "主要（最多 3 個）";

      priAddBtn = document.createElement("button");
      priAddBtn.className = "panel-action-btn";
      priAddBtn.type = "button";
      priAddBtn.textContent = "＋";
      priAddBtn.id = "btn-add-primary";
      priAddBtn.addEventListener("click", () => store.dispatch(addColor("primaries")));

      priHeader.appendChild(priLabel);
      priHeader.appendChild(priAddBtn);
      priGroup.appendChild(priHeader);

      primariesContainer = document.createElement("div");
      primariesContainer.style.display = "flex";
      primariesContainer.style.flexDirection = "column";
      primariesContainer.style.gap = "6px";
      primariesContainer.style.gridColumn = "span 2";
      priGroup.appendChild(primariesContainer);
      container.appendChild(priGroup);

      /* 2. 輔助色 (最多 6 個) - Item 11: 輔助色移至主要色下方 */
      const accGroup = document.createElement("div");
      accGroup.className = "ctrl-row";
      const accHeader = document.createElement("div");
      accHeader.style.display = "flex";
      accHeader.style.justifyContent = "space-between";
      accHeader.style.alignItems = "center";
      accHeader.style.gridColumn = "span 2";

      accLabel = document.createElement("label");
      accLabel.className = "ctrl-label";
      accLabel.style.color = "#ffffff";
      accLabel.style.fontWeight = "600";
      accLabel.style.fontSize = "13px";
      accLabel.textContent = "輔助（最多 6 個）";

      accAddBtn = document.createElement("button");
      accAddBtn.className = "panel-action-btn";
      accAddBtn.type = "button";
      accAddBtn.textContent = "＋";
      accAddBtn.id = "btn-add-accent";
      accAddBtn.addEventListener("click", () => store.dispatch(addColor("accents")));

      accHeader.appendChild(accLabel);
      accHeader.appendChild(accAddBtn);
      accGroup.appendChild(accHeader);

      accentsContainer = document.createElement("div");
      accentsContainer.style.display = "flex";
      accentsContainer.style.flexDirection = "column";
      accentsContainer.style.gap = "6px";
      accentsContainer.style.gridColumn = "span 2";
      accGroup.appendChild(accentsContainer);
      container.appendChild(accGroup);

      /* 3. 中性色 (固定 1 個) */
      const neuGroup = document.createElement("div");
      neuGroup.className = "ctrl-row";
      neuLabel = document.createElement("label");
      neuLabel.className = "ctrl-label";
      neuLabel.style.color = "#ffffff";
      neuLabel.style.fontWeight = "600";
      neuLabel.style.fontSize = "13px";
      neuLabel.textContent = "中性（最多 1 個）";
      neuGroup.appendChild(neuLabel);

      neutralContainer = document.createElement("div");
      neutralContainer.style.gridColumn = "span 2";
      neuGroup.appendChild(neutralContainer);
      container.appendChild(neuGroup);

      /* 3.5 超連結色 (固定 1 個，獨立調整) */
      const linkGroup = document.createElement("div");
      linkGroup.className = "ctrl-row";
      linkLabel = document.createElement("label");
      linkLabel.className = "ctrl-label";
      linkLabel.style.color = "#ffffff";
      linkLabel.style.fontWeight = "600";
      linkLabel.style.fontSize = "13px";
      linkLabel.textContent = "連結（最多 1 個）";
      linkGroup.appendChild(linkLabel);

      linkContainer = document.createElement("div");
      linkContainer.style.gridColumn = "span 2";
      linkGroup.appendChild(linkContainer);
      container.appendChild(linkGroup);

      /* 4. 狀態色 (大區標題「狀態」，白色大區設計風格，排列比照淺色模式) */
      const semGroup = document.createElement("div");
      semGroup.className = "ctrl-row";
      semGroup.style.borderTop = "1px solid var(--app-border)";
      semGroup.style.paddingTop = "12px";

      const semTitle = document.createElement("div");
      semTitle.style.fontSize = "12px";
      semTitle.style.fontWeight = "600";
      semTitle.style.color = "var(--app-text-muted)";
      semTitle.style.marginBottom = "4px";
      semTitle.style.gridColumn = "span 2";
      semTitle.textContent = t("colors.semantic") || "狀態";
      semLabel = semTitle;
      semGroup.appendChild(semTitle);

      semanticContainer = document.createElement("div");
      semanticContainer.style.display = "flex";
      semanticContainer.style.flexDirection = "column";
      semanticContainer.style.gap = "8px";
      semanticContainer.style.gridColumn = "span 2";
      semanticContainer.style.width = "100%";
      semGroup.appendChild(semanticContainer);
      container.appendChild(semGroup);

      /* 5. 表面色覆蓋 (淺色模式 / 深色模式，常態展開，無外框) */
      const surGroup = document.createElement("div");
      surGroup.className = "ctrl-row";
      surGroup.style.borderTop = "1px solid var(--app-border)";
      surGroup.style.paddingTop = "12px";

      surfaceContainer = document.createElement("div");
      surfaceContainer.id = "surface-override-inputs";
      surfaceContainer.style.display = "flex";
      surfaceContainer.style.flexDirection = "column";
      surfaceContainer.style.gap = "14px";
      surfaceContainer.style.gridColumn = "span 2";
      surGroup.appendChild(surfaceContainer);
      container.appendChild(surGroup);
    }
  });

  const originalUpdate = block.update;
  block.update = function (state) {
    originalUpdate(state);
    if (priLabel) priLabel.textContent = t("colors.primaries");
    if (priAddBtn) priAddBtn.textContent = "＋";
    if (accLabel) accLabel.textContent = t("colors.accents");
    if (accAddBtn) accAddBtn.textContent = "＋";
    if (neuLabel) neuLabel.textContent = t("colors.neutral");
    if (linkLabel) linkLabel.textContent = t("colors.link") || "連結（最多 1 個）";
    if (semLabel) semLabel.textContent = t("colors.semantic");

    const mode = state.meta.previewMode || "light";
    const currentColors = state.colors[mode];
    if (!currentColors) return;

    /* 更新 Primary 色彩清單 */
    if (primariesContainer) {
      const primaries = currentColors.primaries || [];
      const addBtn = block.block.querySelector("#btn-add-primary");
      if (addBtn) addBtn.disabled = primaries.length >= 3;

      if (primariesContainer.children.length === primaries.length) {
        primaries.forEach((col, idx) => {
          updateColorItem(primariesContainer.children[idx], col, primaries.length > 1);
        });
      } else {
        primariesContainer.innerHTML = "";
        primaries.forEach((col, idx) => {
          const item = renderColorItem(
            col,
            (newSeed) => {
              const currentMode = store.getState().meta.previewMode || "light";
              const latestColors = store.getState().colors[currentMode];
              const updated = latestColors.primaries.map((c, i) => (i === idx ? { ...c, seed: newSeed } : c));
              store.dispatch(patch(`colors.${currentMode}.primaries`, updated));
            },
            (id) => store.dispatch(removeColor("primaries", id)),
            primaries.length > 1
          );
          primariesContainer.appendChild(item);
        });
      }
    }

    /* 更新 Accents (最多 6 個) */
    if (accentsContainer) {
      const accents = currentColors.accents || [];
      const addBtn = block.block.querySelector("#btn-add-accent");
      if (addBtn) addBtn.disabled = accents.length >= 6;

      if (accentsContainer.children.length === accents.length) {
        accents.forEach((col, idx) => {
          updateColorItem(accentsContainer.children[idx], col, true);
        });
      } else {
        accentsContainer.innerHTML = "";
        accents.forEach((col, idx) => {
          const item = renderColorItem(
            col,
            (newSeed) => {
              const currentMode = store.getState().meta.previewMode || "light";
              const latestColors = store.getState().colors[currentMode];
              const updated = latestColors.accents.map((c, i) => (i === idx ? { ...c, seed: newSeed } : c));
              store.dispatch(patch(`colors.${currentMode}.accents`, updated));
            },
            (id) => store.dispatch(removeColor("accents", id)),
            true
          );
          accentsContainer.appendChild(item);
        });
      }
    }

    /* 更新 Neutral */
    if (neutralContainer && currentColors.neutral) {
      if (neutralContainer.children.length === 1) {
        updateColorItem(neutralContainer.children[0], currentColors.neutral, false);
      } else {
        neutralContainer.innerHTML = "";
        const item = renderColorItem(
          currentColors.neutral,
          (newSeed) => {
            const currentMode = store.getState().meta.previewMode || "light";
            store.dispatch(patch(`colors.${currentMode}.neutral.seed`, newSeed));
          },
          null,
          false,
          true
        );
        neutralContainer.appendChild(item);
      }
    }

    /* 更新 Link */
    if (linkContainer) {
      const linkObj = currentColors.link || { id: "link", seed: "#7F5539" };
      if (linkContainer.children.length === 1) {
        updateColorItem(linkContainer.children[0], linkObj, false);
      } else {
        linkContainer.innerHTML = "";
        const item = renderColorItem(
          linkObj,
          (newSeed) => {
            const currentMode = store.getState().meta.previewMode || "light";
            store.dispatch(patch(`colors.${currentMode}.link.seed`, newSeed));
          },
          null,
          false,
          true
        );
        linkContainer.appendChild(item);
      }
    }

    /* 更新 Semantic 狀態色 */
    if (semanticContainer && currentColors.semantic) {
      let semInputsMap = semanticContainer._inputsMap;
      if (!semInputsMap) {
        semanticContainer.innerHTML = "";
        semInputsMap = {};
        semanticContainer._inputsMap = semInputsMap;

        const semItems = [
          { key: "success", label: "成功", defaultColor: "#15803d" },
          { key: "warning", label: "警告", defaultColor: "#b45309" },
          { key: "error",   label: "錯誤", defaultColor: "#b91c1c" },
          { key: "info",    label: "資訊", defaultColor: "#0369a1" }
        ];

        semItems.forEach(({ key, label, defaultColor }) => {
          const propGroup = document.createElement("div");
          propGroup.className = "surface-prop-row";
          propGroup.style.display = "flex";
          propGroup.style.alignItems = "center";
          propGroup.style.gap = "10px";
          propGroup.style.width = "100%";

          const propLbl = document.createElement("span");
          propLbl.className = "ctrl-label";
          propLbl.style.minWidth = "85px";
          propLbl.style.flexShrink = "0";
          propLbl.style.color = "#ffffff";
          propLbl.style.fontWeight = "500";
          propLbl.textContent = t(`colors.semantic.${key}`) || label;
          propGroup.appendChild(propLbl);

          const initialSeed = currentColors.semantic[key] || defaultColor;
          const colorItem = renderColorItem(
            { seed: initialSeed },
            (newSeed) => {
              const currentMode = store.getState().meta.previewMode || "light";
              store.dispatch(patch(`colors.${currentMode}.semantic.${key}`, newSeed));
            },
            null,
            false
          );
          colorItem.style.flex = "1";
          colorItem.style.minWidth = "0";

          semInputsMap[key] = {
            bubble: colorItem.querySelector(".color-picker-bubble"),
            nativePicker: colorItem.querySelector("input[type='color']"),
            hexInput: colorItem.querySelector(".color-hex-input"),
            labelEl: propLbl
          };

          propGroup.appendChild(colorItem);
          semanticContainer.appendChild(propGroup);
        });
      }

      /* 同步狀態色值與標籤 */
      Object.keys(semInputsMap).forEach(key => {
        const currentVal = currentColors.semantic[key];
        const el = semInputsMap[key];
        if (el) {
          if (el.labelEl) {
            el.labelEl.textContent = t(`colors.semantic.${key}`) || key;
          }
          if (currentVal) {
            if (el.hexInput !== document.activeElement) {
              el.hexInput.value = currentVal.toLowerCase();
            }
            el.bubble.style.backgroundColor = currentVal;
            if (HEX_REGEX.test(currentVal)) {
              el.nativePicker.value = currentVal.toLowerCase();
            }
          }
        }
      });
    }

    /* 表面色覆蓋 */
    if (surfaceContainer) {
      let inputsMap = surfaceContainer._inputsMap;
      if (!inputsMap) {
        surfaceContainer.innerHTML = "";
        inputsMap = {};
        surfaceContainer._inputsMap = inputsMap;

        const props = [
          { key: "bg",      label: "背景" },
          { key: "surface", label: "卡片" },
          { key: "btnSecondaryBg", label: "次要" },
          { key: "btnInvertedBg", label: "反轉" },
          { key: "text",    label: "文字" },
          { key: "border",  label: "邊框" }
        ];

        const modeSection = document.createElement("div");
        modeSection.style.display = "flex";
        modeSection.style.flexDirection = "column";
        modeSection.style.gap = "8px";
        modeSection.style.width = "100%";

        const modeTitle = document.createElement("div");
        modeTitle.style.fontSize = "12px";
        modeTitle.style.fontWeight = "600";
        modeTitle.style.color = "var(--app-text-muted)";
        modeTitle.style.marginBottom = "2px";
        // Title updates dynamically via update() below based on current mode
        modeSection.appendChild(modeTitle);
        inputsMap[`_title`] = modeTitle;

        props.forEach(({ key: prop, label }) => {
          const propGroup = document.createElement("div");
          propGroup.className = "surface-prop-row";
          propGroup.style.display = "flex";
          propGroup.style.alignItems = "center";
          propGroup.style.gap = "10px";
          propGroup.style.width = "100%";

          const propLbl = document.createElement("span");
          propLbl.className = "ctrl-label";
          propLbl.style.minWidth = "85px";
          propLbl.style.flexShrink = "0";
          propLbl.style.color = "#ffffff";
          propLbl.style.fontWeight = "500";
          propLbl.textContent = t(`colors.surface.${prop}`) || label;
          inputsMap[`${prop}_label`] = propLbl;
          propGroup.appendChild(propLbl);

          const initialSeed = currentColors.surface?.[prop] || (mode === "light" ? "#ffffff" : "#000000");
          const colorItem = renderColorItem(
            { seed: initialSeed },
            (newSeed) => {
              // Since mode is bound in closure from creation time, we need to read the CURRENT mode dynamically!
              const currentMode = store.getState().meta.previewMode || "light";
              store.dispatch(patch(`colors.${currentMode}.surface.${prop}`, newSeed));
            },
            null,
            false
          );
          colorItem.style.flex = "1";
          colorItem.style.minWidth = "0";

          inputsMap[prop] = {
            bubble: colorItem.querySelector(".color-picker-bubble"),
            nativePicker: colorItem.querySelector("input[type='color']"),
            hexInput: colorItem.querySelector(".color-hex-input"),
            labelEl: propLbl
          };

          propGroup.appendChild(colorItem);
          modeSection.appendChild(propGroup);
        });

        surfaceContainer.appendChild(modeSection);
      }

      /* 動態同步各數值 (對應目前 mode) */
      if (inputsMap[`_title`]) {
        inputsMap[`_title`].textContent = t("colors.surfaceOverride.system") || "系統";
      }

      const props = ["bg", "surface", "btnSecondaryBg", "btnInvertedBg", "text", "border"];
      props.forEach(prop => {
        const currentVal = currentColors.surface?.[prop];
        const el = inputsMap[prop];
        if (el) {
          if (el.labelEl) {
            el.labelEl.textContent = t(`colors.surface.${prop}`) || prop;
          }
          if (currentVal) {
            if (el.hexInput !== document.activeElement) {
              el.hexInput.value = currentVal.toLowerCase();
            }
            el.bubble.style.backgroundColor = currentVal;
            if (HEX_REGEX.test(currentVal)) {
              el.nativePicker.value = currentVal.toLowerCase();
            }
          }
        }
      });
    }
  };

  block.update(store.getState());
  return block;
}

  });

  define("./src/panels/p3Typography.js", function(__require, exports) {
/* 設定區塊 3：字體（完全遵循使用者要求：全量 Google Fonts 搜尋、A-Z 升冪排序、英中各三款、無備用字型） */
const { createPanelBlock } = __require("./panelBase.js");
const { patch, setTypeOverride, clearTypeOverride } = __require("../core/actions.js");
const { ALL_FONTS, CJK_FONTS } = __require("../fonts/catalog.js");
const { ensureFont } = __require("../fonts/loader.js");
const { TYPE_SCALE_TABLE } = __require("../tokens/derive.js");
const { t } = __require("../i18n/index.js");

exports.createTypographyPanel = createTypographyPanel; function createTypographyPanel(store) {
  let headingCombobox, bodyCombobox, labelCombobox;
  let cjkHeadingCombobox, cjkBodyCombobox, cjkLabelCombobox;
  let baseSizeInput, ratioInput;
  let stepsContainer;
  /* 字型區段標題與欄位標籤（需隨語言切換） */
  let engSectionTitle, cjkSectionTitle;
  let headingLbl, bodyLbl, labelLbl;
  let cjkHeadingLbl, cjkBodyLbl, cjkLabelLbl;
  let baseSizeLbl, ratioLbl;

  function createSearchableFontSelect(initialVal, isCjkOnly = false, onChange) {
    const container = document.createElement("div");
    container.className = "font-combobox-container";
    container.style.position = "relative";
    container.style.flex = "1";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "ctrl-input font-combobox-input";
    input.value = initialVal || "";
    input.placeholder = t("typography.searchPlaceholder") || "搜尋字型...";
    input.style.width = "100%";
    input.style.boxSizing = "border-box";

    const dropdown = document.createElement("div");
    dropdown.className = "font-combobox-dropdown";
    dropdown.style.display = "none";
    dropdown.style.position = "absolute";
    dropdown.style.top = "100%";
    dropdown.style.left = "0";
    dropdown.style.right = "0";
    dropdown.style.maxHeight = "180px";
    dropdown.style.overflowY = "auto";
    dropdown.style.background = "var(--app-surface, #1e1e24)";
    dropdown.style.border = "1px solid var(--app-border, #3f3f46)";
    dropdown.style.borderRadius = "var(--app-radius-sm, 4px)";
    dropdown.style.zIndex = "1000";
    dropdown.style.boxShadow = "0 8px 16px rgba(0,0,0,0.35)";

    const fontList = isCjkOnly ? CJK_FONTS : ALL_FONTS;

    function renderOptions(filter = "") {
      dropdown.innerHTML = "";
      const lower = filter.trim().toLowerCase();
      const matches = lower ? fontList.filter(f => f.toLowerCase().includes(lower)) : fontList;

      if (matches.length === 0) {
        const empty = document.createElement("div");
        empty.style.padding = "6px 10px";
        empty.style.fontSize = "12px";
        empty.style.color = "var(--app-text-muted)";
        empty.textContent = t("typography.noResult") || "查無字型";
        dropdown.appendChild(empty);
        return;
      }

      const limit = matches.slice(0, 100);
      for (const font of limit) {
        const opt = document.createElement("div");
        opt.className = "font-combobox-option";
        opt.style.padding = "6px 10px";
        opt.style.fontSize = "12px";
        opt.style.cursor = "pointer";
        opt.style.color = "var(--app-text, #ffffff)";
        opt.textContent = font;
        if (font === input.value) {
          opt.style.backgroundColor = "var(--app-primary-subtle, rgba(0, 255, 204, 0.15))";
          opt.style.color = "var(--app-primary, #00ffcc)";
        }
        opt.addEventListener("mouseenter", () => {
          opt.style.backgroundColor = "var(--app-surface-hover, rgba(255,255,255,0.08))";
        });
        opt.addEventListener("mouseleave", () => {
          opt.style.backgroundColor = font === input.value ? "var(--app-primary-subtle, rgba(0, 255, 204, 0.15))" : "transparent";
        });
        opt.addEventListener("mousedown", (e) => {
          e.preventDefault();
          selectFont(font);
        });
        dropdown.appendChild(opt);
      }
    }

    function selectFont(font) {
      input.value = font;
      dropdown.style.display = "none";
      onChange(font);
      ensureFont(font);
    }

    input.addEventListener("focus", () => {
      renderOptions(input.value);
      dropdown.style.display = "block";
    });

    input.addEventListener("input", () => {
      renderOptions(input.value);
      dropdown.style.display = "block";
    });

    input.addEventListener("blur", () => {
      const exact = fontList.find(f => f.toLowerCase() === input.value.trim().toLowerCase());
      if (exact) {
        selectFont(exact);
      }
      dropdown.style.display = "none";
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const firstOpt = dropdown.querySelector(".font-combobox-option");
        if (firstOpt && firstOpt.textContent !== (t("typography.noResult") || "查無字型")) {
          selectFont(firstOpt.textContent);
        }
        input.blur();
      } else if (e.key === "Escape") {
        dropdown.style.display = "none";
      }
    });

    container.appendChild(input);
    container.appendChild(dropdown);

    return {
      element: container,
      getValue: () => input.value,
      setValue: (val) => {
        input.value = val;
      },
      inputEl: input
    };
  }

  const block = createPanelBlock({
    id: "typography",
    titleKey: "panel.typography.title",
    store,
    renderContent(container, store) {
      /* 1. 英文字型 */
      engSectionTitle = document.createElement("div");
      engSectionTitle.style.fontSize = "12px";
      engSectionTitle.style.fontWeight = "600";
      engSectionTitle.style.color = "var(--app-text-muted)";
      engSectionTitle.style.marginBottom = "4px";
      engSectionTitle.textContent = t("typography.engFont") || "英文字型";
      container.appendChild(engSectionTitle);

      const headingRow = document.createElement("div");
      headingRow.className = "ctrl-row";
      headingLbl = document.createElement("label");
      headingLbl.className = "ctrl-label";
      headingLbl.textContent = t("typography.headingFont") || "標題";
      headingCombobox = createSearchableFontSelect("Roboto", false, (val) => store.dispatch(patch("typography.families.heading", val)));
      headingRow.appendChild(headingLbl);
      headingRow.appendChild(headingCombobox.element);
      container.appendChild(headingRow);

      const bodyRow = document.createElement("div");
      bodyRow.className = "ctrl-row";
      bodyLbl = document.createElement("label");
      bodyLbl.className = "ctrl-label";
      bodyLbl.textContent = t("typography.bodyFont") || "內文";
      bodyCombobox = createSearchableFontSelect("Roboto", false, (val) => store.dispatch(patch("typography.families.body", val)));
      bodyRow.appendChild(bodyLbl);
      bodyRow.appendChild(bodyCombobox.element);
      container.appendChild(bodyRow);

      const labelRow = document.createElement("div");
      labelRow.className = "ctrl-row";
      labelLbl = document.createElement("label");
      labelLbl.className = "ctrl-label";
      labelLbl.textContent = t("typography.monoFont") || "標籤";
      labelCombobox = createSearchableFontSelect("Roboto", false, (val) => store.dispatch(patch("typography.families.label", val)));
      labelRow.appendChild(labelLbl);
      labelRow.appendChild(labelCombobox.element);
      container.appendChild(labelRow);

      /* 2. 中文字型 */
      cjkSectionTitle = document.createElement("div");
      cjkSectionTitle.style.fontSize = "12px";
      cjkSectionTitle.style.fontWeight = "600";
      cjkSectionTitle.style.color = "var(--app-text-muted)";
      cjkSectionTitle.style.marginTop = "12px";
      cjkSectionTitle.style.marginBottom = "4px";
      cjkSectionTitle.textContent = t("typography.cjkFont") || "中文字型";
      container.appendChild(cjkSectionTitle);

      const cjkHeadingRow = document.createElement("div");
      cjkHeadingRow.className = "ctrl-row";
      cjkHeadingLbl = document.createElement("label");
      cjkHeadingLbl.className = "ctrl-label";
      cjkHeadingLbl.textContent = t("typography.headingFont") || "標題";
      cjkHeadingCombobox = createSearchableFontSelect("Noto Sans TC", true, (val) => store.dispatch(patch("typography.families.cjkHeading", val)));
      cjkHeadingRow.appendChild(cjkHeadingLbl);
      cjkHeadingRow.appendChild(cjkHeadingCombobox.element);
      container.appendChild(cjkHeadingRow);

      const cjkBodyRow = document.createElement("div");
      cjkBodyRow.className = "ctrl-row";
      cjkBodyLbl = document.createElement("label");
      cjkBodyLbl.className = "ctrl-label";
      cjkBodyLbl.textContent = t("typography.bodyFont") || "內文";
      cjkBodyCombobox = createSearchableFontSelect("Noto Sans TC", true, (val) => store.dispatch(patch("typography.families.cjkBody", val)));
      cjkBodyRow.appendChild(cjkBodyLbl);
      cjkBodyRow.appendChild(cjkBodyCombobox.element);
      container.appendChild(cjkBodyRow);

      const cjkLabelRow = document.createElement("div");
      cjkLabelRow.className = "ctrl-row";
      cjkLabelLbl = document.createElement("label");
      cjkLabelLbl.className = "ctrl-label";
      cjkLabelLbl.textContent = t("typography.monoFont") || "標籤";
      cjkLabelCombobox = createSearchableFontSelect("Noto Sans TC", true, (val) => store.dispatch(patch("typography.families.cjkLabel", val)));
      cjkLabelRow.appendChild(cjkLabelLbl);
      cjkLabelRow.appendChild(cjkLabelCombobox.element);
      container.appendChild(cjkLabelRow);

      /* 3. 基準字級與比例 */
      const separator = document.createElement("div");
      separator.style.borderTop = "1px solid var(--app-border)";
      separator.style.margin = "16px 0 12px 0";
      container.appendChild(separator);

      const baseRow = document.createElement("div");
      baseRow.className = "ctrl-row";
      baseSizeLbl = document.createElement("label");
      baseSizeLbl.className = "ctrl-label";
      baseSizeLbl.textContent = t("typography.baseSize");
      baseSizeInput = document.createElement("input");
      baseSizeInput.type = "number";
      baseSizeInput.className = "ctrl-input";
      baseSizeInput.min = 12;
      baseSizeInput.max = 24;
      baseSizeInput.value = 16;
      baseSizeInput.addEventListener("change", (e) => {
        const val = Math.max(12, Math.min(24, parseInt(e.target.value) || 16));
        store.dispatch(patch("typography.scale.baseSize", val));
      });
      baseRow.appendChild(baseSizeLbl);
      baseRow.appendChild(baseSizeInput);
      container.appendChild(baseRow);

      const ratioRow = document.createElement("div");
      ratioRow.className = "ctrl-row";
      ratioLbl = document.createElement("label");
      ratioLbl.className = "ctrl-label";
      ratioLbl.textContent = t("typography.ratio");
      ratioInput = document.createElement("input");
      ratioInput.type = "number";
      ratioInput.className = "ctrl-input";
      ratioInput.min = 1.05;
      ratioInput.max = 1.618;
      ratioInput.step = 0.005;
      ratioInput.value = 1.25;
      ratioInput.addEventListener("change", (e) => {
        const val = Math.max(1.05, Math.min(1.618, parseFloat(e.target.value) || 1.25));
        store.dispatch(patch("typography.scale.ratio", Math.round(val * 1000) / 1000));
      });
      ratioRow.appendChild(ratioLbl);
      ratioRow.appendChild(ratioInput);
      container.appendChild(ratioRow);

      /* 4. 9 階微調清單 */
      stepsContainer = document.createElement("div");
      stepsContainer.style.display = "flex";
      stepsContainer.style.flexDirection = "column";
      stepsContainer.style.gap = "8px";
      stepsContainer.style.borderTop = "1px solid var(--app-border)";
      stepsContainer.style.paddingTop = "12px";
      container.appendChild(stepsContainer);
    }
  });

  const originalUpdate = block.update;
  block.update = function (state) {
    originalUpdate(state);
    const { typography } = state;

    /* 隨語言切換更新標籤文字 */
    if (engSectionTitle) engSectionTitle.textContent = t("typography.engFont") || "英文字型";
    if (cjkSectionTitle) cjkSectionTitle.textContent = t("typography.cjkFont") || "中文字型";
    if (headingLbl)    headingLbl.textContent    = t("typography.headingFont") || "標題";
    if (bodyLbl)       bodyLbl.textContent       = t("typography.bodyFont")    || "內文";
    if (labelLbl)      labelLbl.textContent      = t("typography.monoFont")    || "標籤";
    if (cjkHeadingLbl) cjkHeadingLbl.textContent = t("typography.headingFont") || "標題";
    if (cjkBodyLbl)    cjkBodyLbl.textContent    = t("typography.bodyFont")    || "內文";
    if (cjkLabelLbl)   cjkLabelLbl.textContent   = t("typography.monoFont")   || "標籤";

    const placeholderText = t("typography.searchPlaceholder") || "搜尋字型...";
    if (headingCombobox && headingCombobox.inputEl) headingCombobox.inputEl.placeholder = placeholderText;
    if (bodyCombobox && bodyCombobox.inputEl) bodyCombobox.inputEl.placeholder = placeholderText;
    if (labelCombobox && labelCombobox.inputEl) labelCombobox.inputEl.placeholder = placeholderText;
    if (cjkHeadingCombobox && cjkHeadingCombobox.inputEl) cjkHeadingCombobox.inputEl.placeholder = placeholderText;
    if (cjkBodyCombobox && cjkBodyCombobox.inputEl) cjkBodyCombobox.inputEl.placeholder = placeholderText;
    if (cjkLabelCombobox && cjkLabelCombobox.inputEl) cjkLabelCombobox.inputEl.placeholder = placeholderText;

    if (baseSizeLbl)   baseSizeLbl.textContent   = t("typography.baseSize");
    if (ratioLbl)      ratioLbl.textContent      = t("typography.ratio");

    if (headingCombobox && headingCombobox.getValue() !== typography.families.heading) {
      headingCombobox.setValue(typography.families.heading);
      ensureFont(typography.families.heading);
    }
    if (bodyCombobox && bodyCombobox.getValue() !== typography.families.body) {
      bodyCombobox.setValue(typography.families.body);
      ensureFont(typography.families.body);
    }
    if (labelCombobox && typography.families.label && labelCombobox.getValue() !== typography.families.label) {
      labelCombobox.setValue(typography.families.label);
      ensureFont(typography.families.label);
    }
    if (cjkHeadingCombobox && typography.families.cjkHeading && cjkHeadingCombobox.getValue() !== typography.families.cjkHeading) {
      cjkHeadingCombobox.setValue(typography.families.cjkHeading);
      ensureFont(typography.families.cjkHeading);
    }
    if (cjkBodyCombobox && typography.families.cjkBody && cjkBodyCombobox.getValue() !== typography.families.cjkBody) {
      cjkBodyCombobox.setValue(typography.families.cjkBody);
      ensureFont(typography.families.cjkBody);
    }
    if (cjkLabelCombobox && typography.families.cjkLabel && cjkLabelCombobox.getValue() !== typography.families.cjkLabel) {
      cjkLabelCombobox.setValue(typography.families.cjkLabel);
      ensureFont(typography.families.cjkLabel);
    }

    if (baseSizeInput) baseSizeInput.value = typography.scale.baseSize;
    if (ratioInput) ratioInput.value = typography.scale.ratio;


    /* 渲染 9 階微調列表 */
    if (stepsContainer) {
      stepsContainer.innerHTML = "";
      const baseSize = typography.scale.baseSize || 16;
      const ratio = typography.scale.ratio || 1.25;
      const overrides = typography.overrides || {};

      for (const [step, def] of Object.entries(TYPE_SCALE_TABLE)) {
        const computedSize = Math.round(baseSize * Math.pow(ratio, def.power));
        const ovr = overrides[step] || {};
        const isOverridden = Object.keys(ovr).length > 0;

        const row = document.createElement("div");
        row.style.background = "transparent";
        row.style.border = "none";
        row.style.padding = "8px 0";

        const rowHeader = document.createElement("div");
        rowHeader.style.display = "flex";
        rowHeader.style.justifyContent = "space-between";
        rowHeader.style.alignItems = "center";

        const titleSpan = document.createElement("span");
        titleSpan.style.fontSize = "12px";
        titleSpan.style.fontWeight = "600";
        titleSpan.style.color = "var(--app-text-muted)";
        titleSpan.textContent = step;

        const actionsDiv = document.createElement("div");
        actionsDiv.style.display = "flex";
        actionsDiv.style.gap = "6px";
        actionsDiv.style.alignItems = "center";

        if (isOverridden) {
          const resetBtn = document.createElement("button");
          resetBtn.className = "panel-action-btn";
          resetBtn.type = "button";
          resetBtn.title = t("action.reset");
          resetBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`;
          resetBtn.style.padding = "4px";
          resetBtn.style.display = "inline-flex";
          resetBtn.style.alignItems = "center";
          resetBtn.style.justifyContent = "center";
          resetBtn.style.border = "none";
          resetBtn.style.background = "transparent";
          resetBtn.addEventListener("click", () => store.dispatch(clearTypeOverride(step)));
          actionsDiv.appendChild(resetBtn);
        }

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "panel-action-btn";
        toggleBtn.type = "button";
        toggleBtn.title = t("action.tweak");
        toggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
        toggleBtn.style.padding = "4px";
        toggleBtn.style.display = "inline-flex";
        toggleBtn.style.alignItems = "center";
        toggleBtn.style.justifyContent = "center";
        toggleBtn.style.border = "none";
        toggleBtn.style.background = "transparent";

        const editBox = document.createElement("div");
        editBox.className = "type-override-box";
        editBox.style.display = "none";
        editBox.style.border = "none";
        editBox.style.background = "transparent";
        editBox.style.padding = "8px 0";

        /* 4 個覆寫輸入 */
        const props = [
          { key: "fontSize", label: t("typography.fontSize"), defaultVal: computedSize, type: "number" },
          { key: "letterSpacing", label: t("typography.letterSpacing"), defaultVal: parseFloat(def.ls) || 0, type: "number", step: 0.005 },
          { key: "fontWeight", label: t("typography.fontWeight"), defaultVal: def.fw, type: "number" },
          { key: "lineHeight", label: t("typography.lineHeight"), defaultVal: def.lh, type: "number", step: 0.05 }
        ];

        for (const p of props) {
          const field = document.createElement("div");
          const lbl = document.createElement("span");
          lbl.className = "ctrl-label";
          lbl.style.display = "block";
          lbl.style.marginBottom = "4px";
          lbl.textContent = p.label;
          const inp = document.createElement("input");
          inp.type = p.type;
          if (p.step) inp.step = p.step;
          inp.className = "ctrl-input no-spinners";
          inp.style.padding = "2px 6px";
          inp.value = ovr[p.key] ?? p.defaultVal;
          inp.addEventListener("change", (e) => {
            const val = p.type === "number" ? parseFloat(e.target.value) : e.target.value;
            store.dispatch(setTypeOverride(step, p.key, val));
          });
          field.appendChild(lbl);
          field.appendChild(inp);
          editBox.appendChild(field);
        }

        toggleBtn.addEventListener("click", () => {
          editBox.style.display = editBox.style.display === "none" ? "grid" : "none";
        });

        actionsDiv.appendChild(toggleBtn);
        rowHeader.appendChild(titleSpan);
        rowHeader.appendChild(actionsDiv);

        row.appendChild(rowHeader);
        row.appendChild(editBox);
        stepsContainer.appendChild(row);
      }
    }
  };

  block.update(store.getState());
  return block;
}

  });

  define("./src/panels/p5ElevationShape.js", function(__require, exports) {
/* 設定區塊 5：元件與外觀 (陰影風格、邊框、圓角與內距整合) */
const { createPanelBlock } = __require("./panelBase.js");
const { patch } = __require("../core/actions.js");
const { t } = __require("../i18n/index.js");

const STRATEGY_LEVELS = {
  flat: {
    "level-1": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
    "level-2": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
    "level-3": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
    "level-4": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
    "level-5": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 }
  },
  soft: {
    "level-1": { offsetX: 0, offsetY: 2, blur: 8, spread: 0, opacity: 0.08 },
    "level-2": { offsetX: 0, offsetY: 6, blur: 18, spread: 0, opacity: 0.10 },
    "level-3": { offsetX: 0, offsetY: 16, blur: 36, spread: 0, opacity: 0.14 },
    "level-4": { offsetX: 0, offsetY: 24, blur: 48, spread: 0, opacity: 0.18 },
    "level-5": { offsetX: 0, offsetY: 32, blur: 64, spread: 0, opacity: 0.22 }
  },
  crisp: {
    "level-1": { offsetX: 0, offsetY: 2, blur: 4, spread: 0, opacity: 0.18 },
    "level-2": { offsetX: 0, offsetY: 5, blur: 12, spread: 0, opacity: 0.24 },
    "level-3": { offsetX: 0, offsetY: 12, blur: 24, spread: 0, opacity: 0.32 },
    "level-4": { offsetX: 0, offsetY: 18, blur: 32, spread: 0, opacity: 0.38 },
    "level-5": { offsetX: 0, offsetY: 24, blur: 40, spread: 0, opacity: 0.44 }
  }
};

exports.createElevationShapePanel = createElevationShapePanel; function createElevationShapePanel(store) {
  let stratLbl, stratSelect;
  let borderLbl, borderSlider, borderValText, borderLblText;
  let borderSubcardLblText, borderSubcardValText, borderSubcardSlider;
  let btnRadSlider, btnRadValText, btnRadLbl;
  let inputRadSlider, inputRadValText, inputRadLbl;
  let cardRadSlider, cardRadValText, cardRadLbl;
  let subcardRadSlider, subcardRadValText, subcardRadLbl;
  let checkRadLbl, checkRadValText, checkRadSlider;
  let sliderRadLbl, sliderRadValText, sliderRadSlider;
  let radiusSectionHeader;

  let cardPadLbl, cardPadValText, cardPadSlider;
  let subcardPadLbl, subcardPadValText, subcardPadSlider;
  let paddingSectionHeader;

  const stratOptions = [];

  function createSeparator(container) {
    const div = document.createElement("div");
    div.style.borderTop = "1px solid var(--app-border)";
    div.style.margin = "10px 0 8px";
    container.appendChild(div);
  }

  function createSectionHeader(titleText) {
    const h = document.createElement("div");
    h.style.fontSize = "12px";
    h.style.fontWeight = "600";
    h.style.color = "var(--app-text-muted)";
    h.style.marginTop = "12px";
    h.style.marginBottom = "4px";
    h.textContent = titleText;
    return h;
  }

  function createSliderRow({ labelText, min, max, step = 1, defaultVal, onInput }) {
    const row = document.createElement("div");
    row.className = "ctrl-row";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    const lbl = document.createElement("label");
    lbl.className = "ctrl-label";
    lbl.textContent = labelText;

    const valText = document.createElement("span");
    valText.style.fontSize = "12px";
    valText.style.color = "var(--app-text-muted)";
    valText.textContent = `${defaultVal}`;

    header.appendChild(lbl);
    header.appendChild(valText);
    row.appendChild(header);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "ctrl-slider";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = defaultVal;
    slider.style.width = "100%";
    slider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      valText.textContent = `${val}`;
      onInput(val);
    });

    row.appendChild(slider);
    return { row, lbl, valText, slider };
  }

  const block = createPanelBlock({
    id: "elevation",
    titleKey: "panel.elevation.title",
    store,
    renderContent(container, store) {
      /* 1. 陰影風格 (已刪除) */

      /**
       * 2. 邊框寬度
       * 1. 邊框 (px)
       */
      borderLbl = createSectionHeader(t("shape.borderWidth") || "邊框（像素）");
      container.appendChild(borderLbl);

      const borderRow = createSliderRow({
        labelText: t("components.card") || "Card",
        min: 0,
        max: 10,
        step: 1,
        defaultVal: 1,
        onInput: (val) => {
          store.dispatch(patch("shape.borderWidth", val));
          store.dispatch(patch("shape.borderStrategy", val === 0 ? "none" : (val >= 2 ? "bold" : "hairline")));
        }
      });
      /* 需要變數來儲存標籤與滑桿，以便後續更新數值 */
      borderLblText = borderRow.lbl;
      borderValText = borderRow.valText;
      borderSlider = borderRow.slider;
      container.appendChild(borderRow.row);

      const subcardBorderRow = createSliderRow({
        labelText: t("components.subcard") || "Subcard",
        min: 0,
        max: 10,
        step: 1,
        defaultVal: 1,
        onInput: (val) => {
          store.dispatch(patch("shape.subcardBorderWidth", val));
        }
      });
      borderSubcardLblText = subcardBorderRow.lbl;
      borderSubcardValText = subcardBorderRow.valText;
      borderSubcardSlider = subcardBorderRow.slider;
      container.appendChild(subcardBorderRow.row);

      createSeparator(container);

      /* ── 3. 圓角（像素）區塊 ── */
      radiusSectionHeader = createSectionHeader(t("components.radiusHierarchy") || "圓角（像素）");
      container.appendChild(radiusSectionHeader);

      (() => {
        const r = createSliderRow({
          labelText: t("components.card") || "卡片",
          min: 0, max: 80, defaultVal: 12,
          onInput: (val) => store.dispatch(patch("components.card.radius", val))
        });
        cardRadLbl = r.lbl; cardRadValText = r.valText; cardRadSlider = r.slider;
        container.appendChild(r.row);
      })();

      (() => {
        const r = createSliderRow({
          labelText: t("components.subcard") || "子卡片",
          min: 0, max: 50, defaultVal: 8,
          onInput: (val) => store.dispatch(patch("components.subcard.radius", val))
        });
        subcardRadLbl = r.lbl; subcardRadValText = r.valText; subcardRadSlider = r.slider;
        container.appendChild(r.row);
      })();

      (() => {
        const r = createSliderRow({
          labelText: t("components.button") || "按鈕",
          min: 0, max: 25, defaultVal: 8,
          onInput: (val) => store.dispatch(patch("components.button.radius", val))
        });
        btnRadLbl = r.lbl; btnRadValText = r.valText; btnRadSlider = r.slider;
        container.appendChild(r.row);
      })();

      (() => {
        const r = createSliderRow({
          labelText: t("components.input") || "輸入框",
          min: 0, max: 30, defaultVal: 8,
          onInput: (val) => store.dispatch(patch("components.input.radius", val))
        });
        inputRadLbl = r.lbl; inputRadValText = r.valText; inputRadSlider = r.slider;
        container.appendChild(r.row);
      })();

      (() => {
        const r = createSliderRow({
          labelText: t("components.controls") || "控制項",
          min: 0, max: 15, defaultVal: 4,
          onInput: (val) => store.dispatch(patch("components.checkboxRadio.radius", val))
        });
        checkRadLbl = r.lbl; checkRadValText = r.valText; checkRadSlider = r.slider;
        container.appendChild(r.row);
      })();

      createSeparator(container);

      /* ── 4. 內距（像素）區塊 ── */
      paddingSectionHeader = createSectionHeader(t("components.paddingSection") || "內距（像素）");
      container.appendChild(paddingSectionHeader);

      (() => {
        const r = createSliderRow({
          labelText: t("components.cardPadding") || "卡片",
          min: 0, max: 50, defaultVal: 16,
          onInput: (val) => store.dispatch(patch("components.card.padding", val))
        });
        cardPadLbl = r.lbl; cardPadValText = r.valText; cardPadSlider = r.slider;
        container.appendChild(r.row);
      })();

      (() => {
        const r = createSliderRow({
          labelText: t("components.subcardPadding") || "子卡片",
          min: 0, max: 40, defaultVal: 12,
          onInput: (val) => store.dispatch(patch("components.subcard.padding", val))
        });
        subcardPadLbl = r.lbl; subcardPadValText = r.valText; subcardPadSlider = r.slider;
        container.appendChild(r.row);
      })();
    }
  });

  const originalUpdate = block.update;
  block.update = function (state) {
    originalUpdate(state);
    if (stratLbl) stratLbl.textContent = t("elevation.strategy") || "陰影風格";
    if (borderLbl) borderLbl.textContent = t("shape.borderWidth") || "邊框（像素）";
    if (borderLblText) borderLblText.textContent = t("components.card") || "Card";

    if (borderSubcardLblText) borderSubcardLblText.textContent = t("components.subcard") || "Subcard";

    if (stratOptions) {
      stratOptions.forEach(item => {
        item.opt.textContent = t(`elevation.strategy.${item.val}`) || item.label;
      });
    }

    if (radiusSectionHeader) radiusSectionHeader.textContent = t("components.radiusHierarchy") || "圓角（像素）";
    if (paddingSectionHeader) paddingSectionHeader.textContent = t("components.paddingSection") || "內距（像素）";

    if (cardRadLbl)    cardRadLbl.textContent    = t("components.card")     || "卡片";
    if (subcardRadLbl) subcardRadLbl.textContent = t("components.subcard")  || "子卡片";
    if (btnRadLbl)     btnRadLbl.textContent     = t("components.button")   || "按鈕";
    if (inputRadLbl)   inputRadLbl.textContent   = t("components.input")    || "輸入框";
    if (checkRadLbl)   checkRadLbl.textContent   = t("components.controls") || "控制項";
    if (sliderRadLbl)  sliderRadLbl.textContent  = t("components.slider")   || "Slider";

    if (cardPadLbl)    cardPadLbl.textContent    = t("components.cardPadding")    || "卡片";
    if (subcardPadLbl) subcardPadLbl.textContent = t("components.subcardPadding") || "子卡片";

    const { elevation, shape, components = {} } = state;
    if (stratSelect) {
      stratSelect.value = elevation.strategy || "crisp";
    }
    if (borderSlider) {
      const bw = shape.borderWidth ?? (shape.borderStrategy === "none" ? 0 : 1);
      borderSlider.value = bw;
      if (borderValText) borderValText.textContent = `${bw}`;
    }
    if (borderSubcardSlider) {
      const sbw = shape.subcardBorderWidth ?? 1;
      borderSubcardSlider.value = sbw;
      if (borderSubcardValText) borderSubcardValText.textContent = `${sbw}`;
    }

    const cardRad = typeof components.card?.radius === "number" ? components.card.radius : 12;
    if (cardRadSlider) { cardRadSlider.value = cardRad; if (cardRadValText) cardRadValText.textContent = `${cardRad}`; }

    const subcardRad = typeof components.subcard?.radius === "number" ? components.subcard.radius : 8;
    if (subcardRadSlider) { subcardRadSlider.value = subcardRad; if (subcardRadValText) subcardRadValText.textContent = `${subcardRad}`; }

    const btnRad = typeof components.button?.radius === "number" ? components.button.radius : 8;
    if (btnRadSlider) { btnRadSlider.value = btnRad; if (btnRadValText) btnRadValText.textContent = `${btnRad}`; }

    const inputRad = typeof components.input?.radius === "number" ? components.input.radius : 8;
    if (inputRadSlider) { inputRadSlider.value = inputRad; if (inputRadValText) inputRadValText.textContent = `${inputRad}`; }

    const checkRad = typeof components.checkboxRadio?.radius === "number" ? components.checkboxRadio.radius : 4;
    if (checkRadSlider) { checkRadSlider.value = checkRad; if (checkRadValText) checkRadValText.textContent = `${checkRad}`; }

    const cardPad = typeof components.card?.padding === "number" ? components.card.padding : 16;
    if (cardPadSlider) { cardPadSlider.value = cardPad; if (cardPadValText) cardPadValText.textContent = `${cardPad}`; }

    const subcardPad = typeof components.subcard?.padding === "number" ? components.subcard.padding : 12;
    if (subcardPadSlider) { subcardPadSlider.value = subcardPad; if (subcardPadValText) subcardPadValText.textContent = `${subcardPad}`; }
  };

  block.update(store.getState());
  return block;
}

  });

  define("./src/panels/panelBase.js", function(__require, exports) {
/* 設定區塊共用基底模組（完全遵循 SPEC 第 9.3.1 與 9.3.2 節） */
const { setPanelOpen, setPanelCompleted } = __require("../core/actions.js");
const { t } = __require("../i18n/index.js");

exports.createPanelBlock = createPanelBlock; function createPanelBlock({ id, titleKey, store, renderContent, showAction = true }) {
  const block = document.createElement("div");
  block.className = "panel-block";
  block.id = `panel-${id}`;

  const header = document.createElement("div");
  header.className = "panel-header";

  const titleEl = document.createElement("span");
  titleEl.className = "panel-header-title";
  titleEl.textContent = t(titleKey);

  const rightEl = document.createElement("div");
  rightEl.className = "panel-header-right";

  let statusEl = null;
  let actionBtn = null;

  if (showAction) {
    /* 綠色完成狀態文字（位於按鈕外部左側, SPEC 9.3.1） */
    statusEl = document.createElement("span");
    statusEl.className = "panel-status-text";
    statusEl.textContent = t("status.completed");

    /* 動作按鈕（完成 / 編輯） */
    actionBtn = document.createElement("button");
    actionBtn.className = "panel-action-btn icon-btn";
    actionBtn.type = "button";
    actionBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    actionBtn.title = t("action.done");

    rightEl.appendChild(statusEl);
    rightEl.appendChild(actionBtn);
  }

  /* 收合圖示按鈕 */
  const collapseBtn = document.createElement("button");
  collapseBtn.className = "panel-collapse-btn";
  collapseBtn.type = "button";
  collapseBtn.innerHTML = `<svg class="chevron-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  rightEl.appendChild(collapseBtn);

  header.appendChild(titleEl);
  header.appendChild(rightEl);

  const content = document.createElement("div");
  content.className = "panel-content";

  block.appendChild(header);
  block.appendChild(content);

  /* 點擊標題列切換開合 */
  header.addEventListener("click", (e) => {
    if (actionBtn && e.target.closest(".panel-action-btn")) return; /* 避免觸發動作按鈕 */
    const state = store.getState();
    const currentOpen = state.ui?.panels?.[id]?.open ?? false;
    store.dispatch(setPanelOpen(id, !currentOpen));
  });

  if (actionBtn) {
    /* 點擊動作按鈕（完成 / 編輯 狀態機轉換） */
    actionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const state = store.getState();
      const currentCompleted = state.ui?.panels?.[id]?.completed ?? false;
      /* 點完成 -> completed=true (自動收合)；點編輯 -> completed=false (自動展開) */
      store.dispatch(setPanelCompleted(id, !currentCompleted));
    });
  }

  /* 呼叫內容渲染回呼 */
  renderContent(content, store);

  /* 監聽狀態變更以同步 UI */
  function update(state) {
    const panelState = state.ui?.panels?.[id] || { open: false, completed: false };

    if (panelState.open) {
      block.classList.add("open");
    } else {
      block.classList.remove("open");
    }

    if (actionBtn) {
      if (panelState.completed) {
        block.classList.add("completed");
        actionBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
        actionBtn.title = t("action.edit");
      } else {
        block.classList.remove("completed");
        actionBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        actionBtn.title = t("action.done");
      }
    }

    titleEl.textContent = t(titleKey);
    if (statusEl) statusEl.textContent = t("status.completed");
  }

  /* 初始化首次同步 */
  update(store.getState());

  return {
    block,
    update
  };
}

  });

  define("./src/preview/cards/cardButtons.js", function(__require, exports) {
exports.createButtonsCard = createButtonsCard; function createButtonsCard(store) {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-buttons';
  card.id = 'card-buttons';

  card.innerHTML = `
    <div class="preview-card-body buttons-matrix">
      <!-- 1. Primary Style -->
      <div class="button-style-group" id="btn-group-primary">
        <span class="button-group-title"><span class="lang-zh">主要</span><span class="lang-sep"> / </span><span class="lang-en">Primary</span></span>
        <div class="button-row-states" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="ds-btn ds-btn-primary ds-btn-md"><span class="lang-zh">一般</span><span class="lang-sep"> / </span><span class="lang-en">Rest</span></button>
          <button class="ds-btn ds-btn-primary ds-btn-md is-hover"><span class="lang-zh">懸停</span><span class="lang-sep"> / </span><span class="lang-en">Hover</span></button>
          <button class="ds-btn ds-btn-primary ds-btn-md is-focus"><span class="lang-zh">聚焦</span><span class="lang-sep"> / </span><span class="lang-en">Focus</span></button>
          <button class="ds-btn ds-btn-primary ds-btn-md is-disabled" disabled><span class="lang-zh">停用</span><span class="lang-sep"> / </span><span class="lang-en">Disabled</span></button>
        </div>
      </div>

      <!-- 2. Secondary Style -->
      <div class="button-style-group" id="btn-group-secondary">
        <span class="button-group-title"><span class="lang-zh">次要</span><span class="lang-sep"> / </span><span class="lang-en">Secondary</span></span>
        <div class="button-row-states" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="ds-btn ds-btn-secondary ds-btn-md"><span class="lang-zh">一般</span><span class="lang-sep"> / </span><span class="lang-en">Rest</span></button>
          <button class="ds-btn ds-btn-secondary ds-btn-md is-hover"><span class="lang-zh">懸停</span><span class="lang-sep"> / </span><span class="lang-en">Hover</span></button>
          <button class="ds-btn ds-btn-secondary ds-btn-md is-focus"><span class="lang-zh">聚焦</span><span class="lang-sep"> / </span><span class="lang-en">Focus</span></button>
          <button class="ds-btn ds-btn-secondary ds-btn-md is-disabled" disabled><span class="lang-zh">停用</span><span class="lang-sep"> / </span><span class="lang-en">Disabled</span></button>
        </div>
      </div>

      <!-- 3. Inverted Style -->
      <div class="button-style-group" id="btn-group-inverted">
        <span class="button-group-title"><span class="lang-zh">反轉</span><span class="lang-sep"> / </span><span class="lang-en">Inverted</span></span>
        <div class="button-row-states" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="ds-btn ds-btn-inverted ds-btn-md"><span class="lang-zh">一般</span><span class="lang-sep"> / </span><span class="lang-en">Rest</span></button>
          <button class="ds-btn ds-btn-inverted ds-btn-md is-hover"><span class="lang-zh">懸停</span><span class="lang-sep"> / </span><span class="lang-en">Hover</span></button>
          <button class="ds-btn ds-btn-inverted ds-btn-md is-focus"><span class="lang-zh">聚焦</span><span class="lang-sep"> / </span><span class="lang-en">Focus</span></button>
          <button class="ds-btn ds-btn-inverted ds-btn-md is-disabled" disabled><span class="lang-zh">停用</span><span class="lang-sep"> / </span><span class="lang-en">Disabled</span></button>
        </div>
      </div>

      <!-- 4. Outlined Style -->
      <div class="button-style-group" id="btn-group-outlined">
        <span class="button-group-title"><span class="lang-zh">邊框</span><span class="lang-sep"> / </span><span class="lang-en">Outlined</span></span>
        <div class="button-row-states" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="ds-btn ds-btn-outlined ds-btn-md"><span class="lang-zh">一般</span><span class="lang-sep"> / </span><span class="lang-en">Rest</span></button>
          <button class="ds-btn ds-btn-outlined ds-btn-md is-hover"><span class="lang-zh">懸停</span><span class="lang-sep"> / </span><span class="lang-en">Hover</span></button>
          <button class="ds-btn ds-btn-outlined ds-btn-md is-focus"><span class="lang-zh">聚焦</span><span class="lang-sep"> / </span><span class="lang-en">Focus</span></button>
          <button class="ds-btn ds-btn-outlined ds-btn-md is-disabled" disabled><span class="lang-zh">停用</span><span class="lang-sep"> / </span><span class="lang-en">Disabled</span></button>
        </div>
      </div>
      
      <!-- 5. Ghost Style -->
      <div class="button-style-group" id="btn-group-ghost">
        <span class="button-group-title"><span class="lang-zh">幽靈</span><span class="lang-sep"> / </span><span class="lang-en">Ghost</span></span>
        <div class="button-row-states" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="ds-btn ds-btn-ghost ds-btn-md"><span class="lang-zh">一般</span><span class="lang-sep"> / </span><span class="lang-en">Rest</span></button>
          <button class="ds-btn ds-btn-ghost ds-btn-md is-hover"><span class="lang-zh">懸停</span><span class="lang-sep"> / </span><span class="lang-en">Hover</span></button>
          <button class="ds-btn ds-btn-ghost ds-btn-md is-focus"><span class="lang-zh">聚焦</span><span class="lang-sep"> / </span><span class="lang-en">Focus</span></button>
          <button class="ds-btn ds-btn-ghost ds-btn-md is-disabled" disabled><span class="lang-zh">停用</span><span class="lang-sep"> / </span><span class="lang-en">Disabled</span></button>
        </div>
      </div>

      <!-- 6. 尺寸展示：6 個按鈕平均分散 -->
      <div class="button-style-group" id="btn-group-sizes" style="width: 100%;">
        <span class="button-group-title"><span class="lang-zh">尺寸</span><span class="lang-sep"> / </span><span class="lang-en">Sizes</span></span>
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; width: 100%;">
          <!-- icon 小 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: calc(var(--ds-btn-radius) * 0.8);" title="小圖示按鈕">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <!-- icon 中 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width: 36px; height: 36px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--ds-btn-radius);" title="中圖示按鈕">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <!-- icon 大 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width: 44px; height: 44px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: calc(var(--ds-btn-radius) * 1.2);" title="大圖示按鈕">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <!-- 文字 小 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width:auto; padding: calc(var(--ds-btn-padding-y) * 0.75) calc(var(--ds-btn-padding-x) * 0.85); font-size: calc(var(--ds-btn-font-size) * 0.85); border-radius: calc(var(--ds-btn-radius) * 0.85);">
            <span class="lang-zh">小尺寸</span><span class="lang-sep"> / </span><span class="lang-en">Small</span>
          </button>
          <!-- 文字 中 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width:auto; padding: var(--ds-btn-padding-y) var(--ds-btn-padding-x);">
            <span class="lang-zh">中尺寸</span><span class="lang-sep"> / </span><span class="lang-en">Medium</span>
          </button>
          <!-- 文字 大 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width:auto; padding: calc(var(--ds-btn-padding-y) * 1.25) calc(var(--ds-btn-padding-x) * 1.2); font-size: calc(var(--ds-btn-font-size) * 1.15); border-radius: calc(var(--ds-btn-radius) * 1.15);">
            <span class="lang-zh">大尺寸</span><span class="lang-sep"> / </span><span class="lang-en">Large</span>
          </button>
        </div>
      </div>
    </div>
  `;

  function update(state) {}

  if (store) {
    update(store.getState());
  }

  return { card, update };
}
  });

  define("./src/preview/cards/cardColorCombos.js", function(__require, exports) {
/* 預覽卡片：色彩組合展示 (Color Combos) */
exports.createColorCombosCard = createColorCombosCard; function createColorCombosCard() {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-combos';
  card.id = 'card-color-combos';
  
  card.innerHTML = `
    <div class="preview-card-body combos-container" style="display:flex; flex-direction:row; width:100%; height:100%; gap:12px; align-items:stretch; padding: 0;">
    </div>
  `;

  function update(state) {
    const container = card.querySelector('.combos-container');
    container.innerHTML = '';
    
    const mode = state.meta?.previewMode || "light";
    const currentColors = state.colors?.[mode] || state.colors?.light;
    const primaries = currentColors?.primaries || [];
    if (primaries.length === 0) return;

    const neutralId = currentColors?.neutral?.id || 'neutral';

    /* 輔助函式：建立獨立色塊 */
    function createBlock(bgId, textId) {
      const block = document.createElement('div');
      block.style.flex = '1';
      block.style.display = 'flex';
      block.style.alignItems = 'center';
      block.style.justifyContent = 'center';
      block.style.borderRadius = 'var(--ds-subcard-radius, var(--ds-radius-md, 8px))';
      block.style.backgroundColor = `var(--ds-color-${bgId}-500)`;
      block.style.color = `var(--ds-color-${textId}-500)`;
      block.style.fontFamily = 'var(--ds-font-headline)';
      block.style.fontSize = 'var(--ds-fs-headline-md, 24px)';
      block.style.lineHeight = 'var(--ds-lh-headline-md, 1.4)';
      block.style.fontWeight = '600';
      block.style.border = 'var(--ds-subcard-border-width, 1px) solid var(--ds-surface-border, #e2e5ea)';
      block.style.boxSizing = 'border-box';
      block.style.padding = '6px 12px';
      block.style.textAlign = 'center';
      
      const isZh = state.meta?.locale === 'zh-TW';
      block.innerHTML = `<span class="lang-zh" style="text-align:center;">${isZh ? '範例文字' : 'Example Text'}</span><span class="lang-en" style="text-align:center;">${!isZh ? 'Example Text' : ''}</span>`;
      return block;
    }

    /* 依照背景主色分組產生色塊組合 */
    for (let i = 0; i < primaries.length; i++) {
      /* 1. 主色與其他主色的組合 */
      if (primaries.length > 1) {
        for (let j = 0; j < primaries.length; j++) {
          if (i !== j) {
            container.appendChild(createBlock(primaries[i].id, primaries[j].id));
          }
        }
      }
      /* 2. 主色與中性色的組合（放置於該主色組合的最後） */
      container.appendChild(createBlock(primaries[i].id, neutralId));
    }
  }

  return { card, update };
}

  });

  define("./src/preview/cards/cardColors.js", function(__require, exports) {
/* 預覽卡片 1：色彩區塊（單列置中排列，寬度填滿，高度自適應填滿） */
const { hexToOklch } = __require("../../color/convert.js");
const { buildRamp } = __require("../../color/ramp.js");

exports.createColorsCard = createColorsCard; function createColorsCard(store) {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-colors';
  card.id = 'card-colors';

  card.innerHTML = `
    <div class="preview-card-body color-ramps-container-wrapper" style="display:flex; flex-direction:row; justify-content:center; align-items:stretch; flex: 1; min-height: 0; width:100%; overflow-x:auto; padding:0;">
      <div class="color-ramps-layout" id="colors-ramp-container" style="display:flex; flex-direction:row; justify-content:center; align-items:stretch; flex: 1; min-height: 0; width:100%; gap:8px;"></div>
    </div>
  `;

  const brandContainer = card.querySelector('#colors-ramp-container');

  function renderRampCard(nameZh, nameEn, seedHex, cssPrefix, isNeutral = false) {
    const rampCard = document.createElement('div');
    rampCard.className = 'ramp-card';
    rampCard.style.flex = '1 1 0';
    rampCard.style.height = '100%';
    rampCard.style.minHeight = '0';
    rampCard.style.display = 'flex';
    rampCard.style.flexDirection = 'column';
    rampCard.style.borderRadius = 'var(--ds-subcard-radius, var(--ds-radius-md, 8px))';
    rampCard.style.overflow = 'hidden';
    rampCard.style.border = 'var(--ds-subcard-border-width, 1px) solid var(--ds-surface-border, #e2e5ea)';
    rampCard.style.boxSizing = 'border-box';

    /* Top half (label-md) */
    const topHalf = document.createElement('div');
    topHalf.className = 'ramp-top-half';
    topHalf.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-500, ${seedHex})` : seedHex;
    topHalf.style.display = 'flex';
    topHalf.style.flexDirection = 'column';
    topHalf.style.justifyContent = 'flex-end';
    topHalf.style.alignItems = 'flex-end';
    topHalf.style.padding = '8px 8px 4px 8px';
    topHalf.style.fontFamily = 'var(--ds-font-label)';
    topHalf.style.fontSize = 'var(--ds-fs-label-md, 13px)';
    topHalf.style.height = '60%';
    topHalf.style.minHeight = '0';
    topHalf.style.flex = 'none';
    topHalf.style.boxSizing = 'border-box';
    topHalf.style.overflow = 'hidden';

    const { L } = hexToOklch(seedHex);
    topHalf.style.color = L > 0.65 ? '#000000' : '#ffffff';

    const label = document.createElement('div');
    label.className = 'ramp-name';
    label.style.fontFamily = 'var(--ds-font-label)';
    label.style.fontSize = 'var(--ds-fs-label-md, 13px)';
    label.style.fontWeight = '600';
    label.innerHTML = `<span class="lang-zh">${nameZh}</span><span class="lang-sep"> / </span><span class="lang-en">${nameEn}</span>`;

    const hexLabel = document.createElement('div');
    hexLabel.className = 'ramp-hex';
    hexLabel.style.fontFamily = 'var(--ds-font-label)';
    hexLabel.style.fontSize = 'var(--ds-fs-label-md, 13px)';
    hexLabel.style.fontWeight = '500';
    hexLabel.textContent = seedHex.toUpperCase();
    hexLabel.style.textAlign = 'right';

    topHalf.appendChild(label);
    topHalf.appendChild(hexLabel);

    /* Bottom half (11 swatches across width) */
    const bottomHalf = document.createElement('div');
    bottomHalf.className = 'ramp-bottom-half';
    bottomHalf.style.display = 'flex';
    bottomHalf.style.width = '100%';
    bottomHalf.style.borderTop = 'none';
    bottomHalf.style.height = '40%';
    bottomHalf.style.minHeight = '0';
    bottomHalf.style.flex = 'none';
    bottomHalf.style.boxSizing = 'border-box';

    const ramp = buildRamp(seedHex, isNeutral);
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    steps.forEach((step, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'ramp-swatch';
      swatch.style.flex = '1';
      swatch.style.height = '100%';
      swatch.style.minWidth = '0';
      swatch.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-${step}, ${ramp[idx]})` : ramp[idx];
      swatch.title = `${nameEn} ${step}`;
      bottomHalf.appendChild(swatch);
    });

    rampCard.appendChild(topHalf);
    rampCard.appendChild(bottomHalf);

    return rampCard;
  }

  function updateRampCard(rampCard, nameZh, nameEn, seedHex, cssPrefix, isNeutral = false) {
    const topHalf = rampCard.querySelector('.ramp-top-half');
    if (topHalf) {
      topHalf.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-500, ${seedHex})` : seedHex;
      const { L } = hexToOklch(seedHex);
      topHalf.style.color = L > 0.65 ? '#000000' : '#ffffff';

      const label = topHalf.querySelector('.ramp-name');
      if (label) {
        label.innerHTML = `<span class="lang-zh">${nameZh}</span><span class="lang-sep"> / </span><span class="lang-en">${nameEn}</span>`;
      }

      const hexLabel = topHalf.querySelector('.ramp-hex');
      if (hexLabel) hexLabel.textContent = seedHex.toUpperCase();
    }

    const swatches = rampCard.querySelectorAll('.ramp-swatch');
    if (swatches && swatches.length === 11) {
      const ramp = buildRamp(seedHex, isNeutral);
      const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
      swatches.forEach((swatch, idx) => {
        swatch.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-${steps[idx]}, ${ramp[idx]})` : ramp[idx];
      });
    }
  }

  function update(state) {
    if (!state || !state.colors) return;
    const mode = state.meta.previewMode || "light";
    const currentColors = state.colors[mode] || state.colors.light;
    const colorList = [];

    /* 1. 主要色 (Primary) */
    const PRIMARY_ZH = ["主要 1", "主要 2", "主要 3"];
    const PRIMARY_EN = ["Primary 1", "Primary 2", "Primary 3"];
    if (currentColors.primaries) {
      currentColors.primaries.forEach((c, idx) => {
        const titleZh = PRIMARY_ZH[idx] || `主要 ${idx + 1}`;
        const titleEn = PRIMARY_EN[idx] || `Primary ${idx + 1}`;
        const prefix = `ds-color-${c.id || (idx === 0 ? "primary" : idx === 1 ? "secondary" : "tertiary")}`;
        colorList.push({ nameZh: titleZh, nameEn: titleEn, seed: c.seed, prefix, isNeutral: false });
      });
    }

    /* 2. 輔助色 (Accent) */
    if (currentColors.accents) {
      currentColors.accents.forEach((c, idx) => {
        const titleZh = `輔助 ${idx + 1}`;
        const titleEn = `Accent ${idx + 1}`;
        const prefix = `ds-color-${c.id || `accent-${idx + 1}`}`;
        colorList.push({ nameZh: titleZh, nameEn: titleEn, seed: c.seed, prefix, isNeutral: false });
      });
    }

    /* 3. 中性色 (Neutral) */
    if (currentColors.neutral) {
      colorList.push({
        nameZh: "中性",
        nameEn: "Neutral",
        seed: currentColors.neutral.seed,
        prefix: "ds-color-neutral",
        isNeutral: true
      });
    }

    /* 4. 連結色 (Link) */
    const linkSeed = currentColors.link?.seed || currentColors.primaries?.[0]?.seed || "#7F5539";
    colorList.push({
      nameZh: "連結",
      nameEn: "Link",
      seed: linkSeed,
      prefix: "ds-color-link",
      isNeutral: false
    });

    /* 5. 狀態色 (成功、警告、錯誤、資訊) */
    const semMap = currentColors.semantic || {};
    const STATUS_ITEMS = [
      { key: "success", nameZh: "成功", nameEn: "Success", defaultHex: "#15803d" },
      { key: "warning", nameZh: "警告", nameEn: "Warning", defaultHex: "#b45309" },
      { key: "error",   nameZh: "錯誤", nameEn: "ERROR",   defaultHex: "#c22020" },
      { key: "info",    nameZh: "資訊", nameEn: "Info",    defaultHex: "#0369a1" }
    ];
    STATUS_ITEMS.forEach(item => {
      colorList.push({
        nameZh: item.nameZh,
        nameEn: item.nameEn,
        seed: semMap[item.key] || item.defaultHex,
        prefix: `ds-color-semantic-${item.key}`,
        isNeutral: false
      });
    });

    if (brandContainer) {
      if (brandContainer.children.length === colorList.length) {
        colorList.forEach((item, idx) => {
          updateRampCard(brandContainer.children[idx], item.nameZh, item.nameEn, item.seed, item.prefix, item.isNeutral);
        });
      } else {
        brandContainer.innerHTML = '';
        colorList.forEach(item => {
          brandContainer.appendChild(renderRampCard(item.nameZh, item.nameEn, item.seed, item.prefix, item.isNeutral));
        });
      }
    }
  }

  if (store) {
    update(store.getState());
  }

  return { card, update };
}

  });

  define("./src/preview/cards/cardDialog.js", function(__require, exports) {
/* 預覽卡片：彈出對話框（展示毛玻璃背景與對話框樣式） */
exports.createDialogCard = createDialogCard; function createDialogCard() {
  const card = document.createElement("div");
  card.className = "preview-card card-col-dialog";
  card.id = "card-dialog";

  card.innerHTML = `
    <div class="dialog-preview-wrapper">
      <div class="dialog-preview-bg">
        <div class="dialog-bg-shape shape-1"></div>
        <div class="dialog-bg-shape shape-2"></div>
        <div class="dialog-bg-shape shape-3"></div>
      </div>
      <div class="dialog-backdrop-overlay"></div>
      <div class="dialog-modal-card">
        <div class="dialog-modal-header">
          <div class="dialog-modal-title">
            <span class="lang-zh">確認刪除項目？</span>
          </div>
          <button type="button" class="dialog-modal-close" aria-label="Close">✕</button>
        </div>
        <div class="dialog-modal-body">
          <span class="lang-zh">此操作將永久移除所選內容，無法復原。是否確定繼續？</span>
        </div>
        <div class="dialog-modal-actions" style="justify-content: space-between;">
          <button type="button" class="ds-btn ds-btn-outlined ds-btn-md" style="flex: 1;">
            <span class="lang-zh">取消</span>
          </button>
          <button type="button" class="ds-btn ds-btn-filled ds-btn-md" style="flex: 1; background-color: var(--ds-color-error-500, #ef4444); border-color: var(--ds-color-error-500, #ef4444); color: #fff;">
            <span class="lang-zh">確認</span>
          </button>
        </div>
      </div>
    </div>
  `;

  return card;
}

  });

  define("./src/preview/cards/cardElevation.js", function(__require, exports) {
/* 預覽卡片 5：陰影區塊（單列橫向排列、帶圓角、label-md 字型） */
exports.createElevationCard = createElevationCard; function createElevationCard() {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-elevation';
  card.id = 'card-elevation';

  card.innerHTML = `
    <div class="preview-card-body elevation-boxes">
      <div class="elevation-box ds-elevation-1"><span class="lang-zh">小陰影</span><span class="lang-sep"> / </span><span class="lang-en">Small Shadow</span></div>
      <div class="elevation-box ds-elevation-2"><span class="lang-zh">中陰影</span><span class="lang-sep"> / </span><span class="lang-en">Medium Shadow</span></div>
      <div class="elevation-box ds-elevation-3"><span class="lang-zh">大陰影</span><span class="lang-sep"> / </span><span class="lang-en">Large Shadow</span></div>
    </div>
  `;
  return card;
}
  });

  define("./src/preview/cards/cardForms.js", function(__require, exports) {
/* 預覽卡片 4：表單元件（輸入框整合、滑桿、Dock 導覽列展示、12 項控制項展示） */
exports.createFormsCard = createFormsCard; function createFormsCard() {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-forms';
  card.id = 'card-forms';

  card.innerHTML = `
    <div class="preview-card-body" style="display:flex; flex-direction:column; gap:14px; padding:2px; overflow:visible; flex: 1; justify-content: space-between;">
      <!-- 1. 輸入框整合區塊 (無多餘小標) -->
      <div class="form-field-group" style="overflow:visible;">
        <label class="form-field-label" style="font-weight:600;"><span class="lang-zh">輸入框</span><span class="lang-sep"> / </span><span class="lang-en">Input</span></label>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; overflow:visible;">
          <input type="text" class="ds-input" id="sample-input-normal" value="標準" placeholder="輸入文字...">
          <input type="text" class="ds-input is-focus" id="sample-input-focus" value="聚焦" placeholder="聚焦狀態...">
          <input type="text" class="ds-input is-disabled" id="sample-input-disabled" value="停止" disabled>
          <!-- 下拉選單 -->
          <div class="ds-custom-select" id="sample-custom-select">
            <div class="ds-custom-select-trigger" tabindex="0" role="button" aria-haspopup="listbox">
              <span class="ds-custom-select-label" id="sample-select-label">選單</span>
              <span class="ds-custom-select-arrow" style="display:flex; align-items:center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </span>
            </div>
            <div class="ds-custom-select-popover" id="sample-select-popover">
              <div class="ds-custom-option" data-val="1">選項一</div>
              <div class="ds-custom-option" data-val="2">選項二</div>
              <div class="ds-custom-option" data-val="3">選項三</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 滑桿 (Slider) -->
      <div class="form-field-group">
        <label class="form-field-label" id="sample-slider-label" style="font-weight:600;"><span class="lang-zh">滑桿</span><span class="lang-sep"> / </span><span class="lang-en">Slider</span></label>
        <div style="padding: 4px 0;">
          <div id="interactive-slider" class="ds-slider" style="width:100%; height:4px; background:var(--ds-btn-secondary-bg, #f1f5f9); border-radius:var(--ds-check-radius, 4px); position:relative; cursor:pointer;">
            <div id="interactive-slider-track" class="ds-slider-track" style="position:absolute; left:0; top:0; height:100%; width:50%; background:var(--ds-color-primary-500, #2563eb); border-radius:var(--ds-check-radius, 4px); pointer-events:none;"></div>
            <div id="interactive-slider-thumb" class="ds-slider-thumb" style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); width:16px; height:16px; background:var(--ds-color-primary-500, #2563eb); border-radius:var(--ds-check-radius, 4px); cursor:pointer;"></div>
          </div>
        </div>
      </div>

      <!-- 3. 導覽列 (Dock & Tabs) -->
      <div class="form-field-group" style="width: 100%;">
        <label class="form-field-label" style="font-weight:600;"><span class="lang-zh">導覽列</span><span class="lang-sep"> / </span><span class="lang-en">Navigation</span></label>
        <div style="display:flex; flex-direction:column; gap: 16px; padding: 4px 0; width: 100%;">
          
          <!-- 底部導覽列 (Dock) -->
          <div id="interactive-dock" style="display: flex; align-items: center; justify-content: space-around; padding: 8px 16px; background: var(--ds-surface-raised, rgba(0,0,0,0.03)); border-radius: var(--ds-btn-radius, 8px); width: 100%; box-sizing: border-box;">
            <div class="dock-item active" style="width: 36px; height: 36px; border-radius: var(--ds-btn-radius, 8px); background: var(--ds-color-primary-500, #3b82f6); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ds-color-on-primary, #ffffff); transition: all 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <div class="dock-item" style="width: 36px; height: 36px; border-radius: var(--ds-btn-radius, 8px); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ds-surface-text-muted, #71717a); background: transparent; transition: all 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <div class="dock-item" style="width: 36px; height: 36px; border-radius: var(--ds-btn-radius, 8px); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ds-surface-text-muted, #71717a); background: transparent; transition: all 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
          </div>

          <!-- 頂部標籤列 (Tabs) -->
          <div class="ds-tabs-wrapper tabs-underline" id="interactive-tabs" style="width: 100%;">
            <button class="ds-tab-btn is-active"><span class="lang-zh">首頁</span><span class="lang-sep"> / </span><span class="lang-en">Home</span></button>
            <button class="ds-tab-btn"><span class="lang-zh">搜尋</span><span class="lang-sep"> / </span><span class="lang-en">Search</span></button>
            <button class="ds-tab-btn"><span class="lang-zh">設定</span><span class="lang-sep"> / </span><span class="lang-en">Settings</span></button>
          </div>
        </div>
      </div>

      <!-- 4. 控制項陣列 -->
      <div class="form-field-group">
        <label class="form-field-label" style="font-weight:600;"><span class="lang-zh">控制項</span><span class="lang-sep"> / </span><span class="lang-en">Controls</span></label>
        <div style="display:flex; flex-direction:column; gap:10px; background:var(--ds-surface-raised, rgba(0,0,0,0.02)); padding:var(--ds-subcard-padding, 12px); border-radius:var(--ds-subcard-radius, 8px); border:var(--ds-subcard-border-width, 1px) solid var(--ds-surface-border, #e2e5ea);">
          <!-- 控制項陣列 (Toggle, Checkbox, Radio) -->
          <div style="display:grid; grid-template-columns: max-content auto auto auto; justify-content: space-between; align-items:center; column-gap: 12px; row-gap: 16px;">
            <!-- 列 1：開關 (Switch) - 6 items -->
            <span style="font-size:var(--ds-fs-label-md, 13px); font-weight:500; color:var(--ds-surface-text);"><span class="lang-zh">開關</span><span class="lang-sep"> / </span><span class="lang-en">Switch</span></span>
            <!-- Small: On, Off -->
            <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
              <div class="ds-toggle checked" style="width:30px; height:16px; cursor:default;"><div class="ds-toggle-knob" style="width:12px; height:12px; top:1px; left:1px; transform:translateX(14px);"></div></div>
              <div class="ds-toggle" style="width:30px; height:16px; cursor:default;"><div class="ds-toggle-knob" style="width:12px; height:12px; top:1px; left:1px; transform:none;"></div></div>
            </div>
            <!-- Medium: On, Off -->
            <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
              <div class="ds-toggle checked" style="width:36px; height:20px; cursor:default;"><div class="ds-toggle-knob" style="width:16px; height:16px; top:1px; left:1px; transform:translateX(16px);"></div></div>
              <div class="ds-toggle" style="width:36px; height:20px; cursor:default;"><div class="ds-toggle-knob" style="width:16px; height:16px; top:1px; left:1px; transform:none;"></div></div>
            </div>
            <!-- Large: On, Off -->
            <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
              <div class="ds-toggle checked" style="cursor:default;"><div class="ds-toggle-knob"></div></div>
              <div class="ds-toggle" style="cursor:default;"><div class="ds-toggle-knob"></div></div>
            </div>

            <!-- 列 2：核取方塊 (Checkbox) - 6 items -->
            <span style="font-size:var(--ds-fs-label-md, 13px); font-weight:500; color:var(--ds-surface-text);"><span class="lang-zh">多選</span><span class="lang-sep"> / </span><span class="lang-en">Checkbox</span></span>
            <!-- Small: Checked, Unchecked -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-checkbox checked" style="width:14px; height:14px; cursor:default;"></div>
              <div class="ds-checkbox" style="width:14px; height:14px; cursor:default;"></div>
            </div>
            <!-- Medium: Checked, Unchecked -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-checkbox checked" style="width:18px; height:18px; cursor:default;"></div>
              <div class="ds-checkbox" style="width:18px; height:18px; cursor:default;"></div>
            </div>
            <!-- Large: Checked, Unchecked -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-checkbox checked" style="width:22px; height:22px; cursor:default;"></div>
              <div class="ds-checkbox" style="width:22px; height:22px; cursor:default;"></div>
            </div>

            <!-- 列 3：單選鈕 (Radio) - 6 items -->
            <span style="font-size:var(--ds-fs-label-md, 13px); font-weight:500; color:var(--ds-surface-text);"><span class="lang-zh">單選</span><span class="lang-sep"> / </span><span class="lang-en">Radio</span></span>
            <!-- Small: Selected, Unselected -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-radio checked" style="width:14px; height:14px; cursor:default;"><div class="ds-radio-dot" style="width:6px; height:6px;"></div></div>
              <div class="ds-radio" style="width:14px; height:14px; cursor:default;"><div class="ds-radio-dot" style="display:none;"></div></div>
            </div>
            <!-- Medium: Selected, Unselected -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-radio checked" style="width:18px; height:18px; cursor:default;"><div class="ds-radio-dot" style="width:8px; height:8px;"></div></div>
              <div class="ds-radio" style="width:18px; height:18px; cursor:default;"><div class="ds-radio-dot" style="display:none;"></div></div>
            </div>
            <!-- Large: Selected, Unselected -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-radio checked" style="width:22px; height:22px; cursor:default;"><div class="ds-radio-dot" style="width:10px; height:10px;"></div></div>
              <div class="ds-radio" style="width:22px; height:22px; cursor:default;"><div class="ds-radio-dot" style="display:none;"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  /* 自訂下拉選單互動事件 */
  const customSelect = card.querySelector('#sample-custom-select');
  const selectTrigger = card.querySelector('.ds-custom-select-trigger');
  const selectPopover = card.querySelector('#sample-select-popover');
  const selectLabel = card.querySelector('#sample-select-label');
  const options = card.querySelectorAll('.ds-custom-option');

  if (selectTrigger && selectPopover) {
    selectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = selectPopover.classList.toggle('is-open');
      selectTrigger.classList.toggle('is-active', isOpen);
    });

    options.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        options.forEach(o => o.classList.remove('is-selected'));
        opt.classList.add('is-selected');
        if (selectLabel) selectLabel.textContent = opt.textContent;
        selectPopover.classList.remove('is-open');
        selectTrigger.classList.remove('is-active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!customSelect.contains(e.target)) {
        selectPopover.classList.remove('is-open');
        selectTrigger.classList.remove('is-active');
      }
    });

    window.addEventListener('app:reset', () => {
      options.forEach(o => o.classList.remove('is-selected'));
      selectPopover.classList.remove('is-open');
      selectTrigger.classList.remove('is-active');
      if (selectLabel) {
        const previewRoot = document.getElementById('preview-root');
        const isZh = previewRoot ? previewRoot.dataset.locale === 'zh-TW' : true;
        selectLabel.textContent = isZh ? "選單" : "Select";
      }
    });
  }

  /* 滑桿互動 */
  const slider = card.querySelector('#interactive-slider');
  const sliderTrack = card.querySelector('#interactive-slider-track');
  const sliderThumb = card.querySelector('#interactive-slider-thumb');
  if (slider && sliderTrack && sliderThumb) {
    let isDragging = false;
    const updateSlider = (clientX) => {
      const rect = slider.getBoundingClientRect();
      let percent = (clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      const percentage = (percent * 100).toFixed(2) + '%';
      sliderTrack.style.width = percentage;
      sliderThumb.style.left = percentage;
    };
    slider.addEventListener('mousedown', (e) => {
      isDragging = true;
      updateSlider(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDragging) updateSlider(e.clientX);
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
    window.addEventListener('app:reset', () => {
      sliderTrack.style.width = '50%';
      sliderThumb.style.left = '50%';
    });
  }

  /* 底部導覽列 (Dock) 互動 */
  const dock = card.querySelector('#interactive-dock');
  if (dock) {
    const dockItems = dock.querySelectorAll('.dock-item');
    dockItems.forEach(item => {
      item.addEventListener('click', () => {
        dockItems.forEach(d => {
          d.classList.remove('active');
          d.style.background = 'transparent';
          d.style.color = 'var(--ds-surface-text-muted, #71717a)';
        });
        item.classList.add('active');
        item.style.background = 'var(--ds-color-primary-500, #3b82f6)';
        item.style.color = 'var(--ds-color-on-primary, #ffffff)';
      });
    });
    window.addEventListener('app:reset', () => {
      dockItems.forEach((d, idx) => {
        if (idx === 0) {
          d.classList.add('active');
          d.style.background = 'var(--ds-color-primary-500, #3b82f6)';
          d.style.color = 'var(--ds-color-on-primary, #ffffff)';
        } else {
          d.classList.remove('active');
          d.style.background = 'transparent';
          d.style.color = 'var(--ds-surface-text-muted, #71717a)';
        }
      });
    });
  }

  /* 頂部標籤列 (Tabs) 互動 */
  const tabs = card.querySelector('#interactive-tabs');
  if (tabs) {
    const tabBtns = tabs.querySelectorAll('.ds-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
    window.addEventListener('app:reset', () => {
      tabBtns.forEach((b, idx) => {
        if (idx === 0) b.classList.add('is-active');
        else b.classList.remove('is-active');
      });
    });
  }

  const inpNormal = card.querySelector("#sample-input-normal");
  const inpFocus = card.querySelector("#sample-input-focus");
  const inpDisabled = card.querySelector("#sample-input-disabled");

  function update(state) {
    const locale = state?.meta?.locale || "zh-TW";
    const isZh = locale === "zh-TW";
    const isEn = locale === "en";

    if (inpNormal) {
      inpNormal.value = isZh ? "標準" : (isEn ? "Standard" : "標準 / Standard");
    }
    if (inpFocus) {
      inpFocus.value = isZh ? "聚焦" : (isEn ? "Focus" : "聚焦 / Focus");
    }
    if (inpDisabled) {
      inpDisabled.value = isZh ? "停止" : (isEn ? "Disabled" : "停止 / Disabled");
    }
    if (options.length >= 3) {
      options[0].textContent = isZh ? "選項一" : (isEn ? "Option 1" : "選項一 / Option 1");
      options[1].textContent = isZh ? "選項二" : (isEn ? "Option 2" : "選項二 / Option 2");
      options[2].textContent = isZh ? "選項三" : (isEn ? "Option 3" : "選項三 / Option 3");
      const selectedOpt = card.querySelector('.ds-custom-option.is-selected');
      if (selectedOpt && selectLabel) {
        selectLabel.textContent = selectedOpt.textContent;
      } else if (selectLabel) {
        selectLabel.textContent = isZh ? "選單" : "Select";
      }
    }
  }

  return { card, update };
}
  });

  define("./src/preview/cards/cardNavbar.js", function(__require, exports) {
/* 導覽列樣式展示模組 (Dock Showcase，對齊附圖 media_1789440967181) */
exports.createNavbarShowcase = createNavbarShowcase; function createNavbarShowcase(store) {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-dock';
  card.id = 'card-dock';

  card.innerHTML = `
    <div class="preview-card-body" style="display:flex; align-items:center; justify-content:center; padding: 20px 0; background: var(--ds-surface-text, #16181d); border-radius: var(--ds-radius-lg, 12px);">
      <div class="dock-container" style="display: flex; align-items: center; gap: 32px; padding: 12px 32px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; backdrop-filter: blur(12px);">
        <div class="dock-item" style="width: 44px; height: 44px; border-radius: 50%; background: var(--ds-color-primary-500, #3b82f6); display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>
        <div class="dock-item" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255, 255, 255, 0.7);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <div class="dock-item" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255, 255, 255, 0.7);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
      </div>
    </div>
  `;

  function update(state) {
    /* Dock 樣式自動套用 token */
  }

  if (store) {
    update(store.getState());
  }

  return { card, update };
}

  });

  define("./src/preview/cards/cardParagraph.js", function(__require, exports) {
/* 預覽卡片：段落展示（主標題、副標題、內文、有序清單、無序清單、程式碼區塊、APA參考連結） */
exports.createParagraphCard = createParagraphCard; function createParagraphCard() {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-paragraph';
  card.id = 'card-paragraph';

  card.innerHTML = `
    <div class="preview-card-body paragraph-body" style="display:flex; flex-direction:column; max-height:100%; overflow-y:auto; padding-right:4px;">
      <!-- 1. 主標題 -->
      <h3 class="paragraph-heading" style="margin:0; font-family:var(--ds-font-heading); font-size:var(--ds-fs-headline-lg, 24px); font-weight:var(--ds-fw-headline-lg, 700); color:var(--ds-surface-text); line-height:var(--ds-lh-headline-lg, 1.15); letter-spacing:var(--ds-ls-headline-lg, -0.02em);">
        <span class="lang-zh">多層次設計語言與空間節奏</span>
        <span class="lang-sep"> / </span>
        <span class="lang-en">Multi-Tier Design Language & Spatial Rhythm</span>
      </h3>

      <!-- 2. 內文 (第一段落) -->
      <p class="paragraph-text" style="margin:0 0 12px 0; font-family:var(--ds-font-body); font-size:var(--ds-fs-body-md, 15px); line-height:1.6; color:var(--ds-surface-text);">
        <span class="lang-zh">現代設計系統不僅是元件的集合，更是一套嚴密的視覺語法與決策模型。透過精準的數學比例推導，系統能在不同尺寸階層維持一致的感知對比，使介面在多樣裝置下皆呈現平衡穩定的空間律動。</span>
        <span class="lang-sep"><br><br></span>
        <span class="lang-en">A modern design system is not merely a collection of components, but a cohesive visual grammar and decision framework. Through modular mathematical ratios, it maintains optical harmony and spatial rhythm across platforms.</span>
      </p>

      <!-- 列表與程式碼區塊並排 -->
      <div style="display:flex; gap:20px;">
        
        <!-- 左側：清單與段落 -->
        <div style="flex:1; display:flex; flex-direction:column;">
          <!-- 3. 有序清單 (>= 2項) -->
          <ol class="paragraph-olist" style="margin:0 0 12px 0; padding-left:22px; font-family:var(--ds-font-body); font-size:var(--ds-fs-body-md, 15px); line-height:1.6; color:var(--ds-surface-text);">
            <li><span class="lang-zh">定義語意化基礎 Token 與多層級變數</span><span class="lang-sep"> / </span><span class="lang-en">Establish semantic tokens and multi-tier variable hierarchy</span></li>
            <li><span class="lang-zh">建立自適應排版網格與參數化間距系統</span><span class="lang-sep"> / </span><span class="lang-en">Implement responsive grids and parametric spatial scales</span></li>
            <li><span class="lang-zh">落實無障礙標準與跨元件互動規範</span><span class="lang-sep"> / </span><span class="lang-en">Enforce accessibility compliance and cohesive component ergonomics</span></li>
          </ol>

          <!-- 4. 副標題 (移至此處，並改為主要文字顏色) -->
          <h4 class="paragraph-subheading" style="margin:0; font-family:var(--ds-font-heading); font-size:var(--ds-fs-headline-md, 20px); font-weight:var(--ds-fw-headline-md, 600); color:var(--ds-surface-text); line-height:var(--ds-lh-headline-md, 1.25); letter-spacing:var(--ds-ls-headline-md, -0.01em);">
            <span class="lang-zh">建構一致性與高延展性的數位產品基礎</span>
            <span class="lang-sep"> / </span>
            <span class="lang-en">Building Consistent & Scalable Digital Foundations</span>
          </h4>

          <!-- 5. 內文 (第二段落) -->
          <p class="paragraph-text" style="margin:0 0 12px 0; font-family:var(--ds-font-body); font-size:var(--ds-fs-body-md, 15px); line-height:1.6; color:var(--ds-surface-text);">
            <span class="lang-zh">我們將各種繁複的設定收斂至直觀的操作介面上。設計師只需調整核心意圖，系統便會自動衍生出相應的層級結構。</span>
            <span class="lang-sep"><br><br></span>
            <span class="lang-en">We converge complex configurations into intuitive interfaces. By adjusting core intents, the system automatically derives the corresponding hierarchical structures.</span>
          </p>

          <!-- 6. 無序清單 (>= 2項) -->
          <ul class="paragraph-list" style="margin:0; padding-left:22px; font-family:var(--ds-font-body); font-size:var(--ds-fs-body-md, 15px); line-height:1.6; color:var(--ds-surface-text);">
            <li><span class="lang-zh">感知均勻色彩演算與智慧對比防護</span><span class="lang-sep"> / </span><span class="lang-en">Perceptually uniform color derivation with contrast guard</span></li>
            <li><span class="lang-zh">多階圓角聯動與層級深度陰影策略</span><span class="lang-sep"> / </span><span class="lang-en">Cascading radius layers and calibrated elevation depths</span></li>
            <li><span class="lang-zh">流暢微交互與無阻礙鍵盤焦點循環</span><span class="lang-sep"> / </span><span class="lang-en">Fluid state transitions and accessible focus ring cycles</span></li>
          </ul>
        </div>

        <!-- 右側：程式碼區塊 -->
        <div style="flex:0 0 max-content; margin-left:auto; position:relative;">
          <span style="position:absolute; top:12px; right:16px; font-size:12px; font-family:var(--ds-font-body); font-weight:400; color:var(--ds-surface-text-muted, #71717a); user-select:none;">CSS</span>
          <pre class="paragraph-code-block" style="margin:0; height:100%; padding:16px 64px 16px 16px; box-sizing:border-box; background:var(--ds-surface-raised, rgba(0,0,0,0.03)); border:1px solid var(--ds-surface-border, #e2e5ea); border-radius:var(--ds-subcard-radius, var(--ds-radius-md, 8px)); overflow-x:hidden; white-space:pre;"><code class="ds-code" style="font-family:var(--ds-font-body); font-size:var(--ds-fs-body-sm, 13px); color:var(--ds-surface-text); line-height:1.5;">:root {
  --ds-color-primary: #8D5B30;
  --ds-spacing-base: 10px;
  --ds-gutter: 20px;
}

.preview-card {
  border-radius: var(--ds-radius-md);
}</code></pre>
        </div>
      </div>

      <!-- 7. 參考資料連結 (APA 格式假連結，恢復 hover) -->
      <div class="paragraph-reference" style="font-family:var(--ds-font-body); font-size:var(--ds-fs-body-sm, 13px); line-height:1.5; color:var(--ds-surface-text-muted, #71717a); border-top:1px solid var(--ds-surface-border, #e2e5ea); padding-top:8px;">
        <span class="lang-zh">參考資料：</span><span class="lang-en">Reference: </span>
        <span>Frost, B. (2016). </span><a href="javascript:void(0)" class="ds-link">Atomic design: Methodology for creating design systems</a><span>. Brad Frost Collection, 4(1), 42–89.</span>
      </div>
    </div>
  `;

  function update(state) {}

  return {
    card,
    update
  };
}

  });

  define("./src/preview/cards/cardStatusColors.js", function(__require, exports) {
/* 預覽卡片：狀態顏色 (獨立主區塊，無標題，包含成功、警告、刪除、資訊 4 色色階) */
const { hexToOklch } = __require("../../color/convert.js");
const { buildRamp } = __require("../../color/ramp.js");

exports.createStatusColorsCard = createStatusColorsCard; function createStatusColorsCard(store) {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-status-colors';
  card.id = 'card-status-colors';

  card.innerHTML = `
    <div class="preview-card-body" style="display:flex; flex-direction:column; height:100%; overflow:hidden; padding:0;">
      <!-- 中性色、超連結與狀態顏色展示區域 (填滿高度，自適應高度) -->
      <div class="status-ramps-layout" id="status-ramps-container" style="display:flex; flex-direction:column; height:100%; gap:8px; flex:1;"></div>
    </div>
  `;

  const statusContainer = card.querySelector('#status-ramps-container');

  function renderRampCard(nameZh, nameEn, seedHex, cssPrefix = '', isNeutral = false) {
    const rampCard = document.createElement('div');
    rampCard.className = 'ramp-card';
    rampCard.style.flex = '1';
    rampCard.style.display = 'flex';
    rampCard.style.flexDirection = 'column';

    /* Top half (body-md, min-height: 80px) */
    const topHalf = document.createElement('div');
    topHalf.className = 'ramp-top-half';
    topHalf.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-500, ${seedHex})` : seedHex;
    topHalf.style.display = 'flex';
    topHalf.style.justifyContent = 'space-between';
    topHalf.style.alignItems = 'flex-end';
    topHalf.style.padding = '8px 12px';
    topHalf.style.minHeight = '80px';
    topHalf.style.fontFamily = 'var(--ds-font-label)';
    topHalf.style.fontSize = 'var(--ds-fs-label-md, 13px)';
    topHalf.style.flex = '1';

    const { L } = hexToOklch(seedHex);
    topHalf.style.color = L > 0.65 ? '#000000' : '#ffffff';

    const label = document.createElement('div');
    label.className = 'ramp-name';
    label.style.fontFamily = 'var(--ds-font-label)';
    label.style.fontSize = 'var(--ds-fs-label-md, 13px)';
    label.style.fontWeight = '600';
    label.innerHTML = `<span class="lang-zh">${nameZh}</span><span class="lang-sep"> / </span><span class="lang-en">${nameEn}</span>`;

    const hexLabel = document.createElement('div');
    hexLabel.className = 'ramp-hex';
    hexLabel.style.fontFamily = 'var(--ds-font-label)';
    hexLabel.style.fontSize = 'var(--ds-fs-label-md, 13px)';
    hexLabel.style.fontWeight = '500';
    hexLabel.textContent = seedHex.toUpperCase();
    hexLabel.style.textAlign = 'right';

    topHalf.appendChild(label);
    topHalf.appendChild(hexLabel);

    /* Bottom half (11 swatches, min-height: 50px, width: 100%) */
    const bottomHalf = document.createElement('div');
    bottomHalf.className = 'ramp-bottom-half';
    bottomHalf.style.display = 'flex';
    bottomHalf.style.width = '100%';
    bottomHalf.style.height = '50px';
    bottomHalf.style.minHeight = '50px';
    bottomHalf.style.borderTop = 'none';
    bottomHalf.style.flexShrink = '0';

    const ramp = buildRamp(seedHex, isNeutral);
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    steps.forEach((step, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'ramp-swatch';
      swatch.style.flex = '1';
      swatch.style.height = '100%';
      swatch.style.minWidth = '0';
      swatch.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-${step}, ${ramp[idx]})` : ramp[idx];
      swatch.title = `${nameEn} ${step}`;
      bottomHalf.appendChild(swatch);
    });

    rampCard.appendChild(topHalf);
    rampCard.appendChild(bottomHalf);
    return rampCard;
  }

  function updateRampCard(rampCard, nameZh, nameEn, seedHex, cssPrefix = '', isNeutral = false) {
    const topHalf = rampCard.querySelector('.ramp-top-half');
    if (topHalf) {
      topHalf.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-500, ${seedHex})` : seedHex;
      const { L } = hexToOklch(seedHex);
      topHalf.style.color = L > 0.65 ? '#000000' : '#ffffff';

      const label = topHalf.querySelector('.ramp-name');
      if (label) {
        label.innerHTML = `<span class="lang-zh">${nameZh}</span><span class="lang-sep"> / </span><span class="lang-en">${nameEn}</span>`;
      }

      const hexLabel = topHalf.querySelector('.ramp-hex');
      if (hexLabel) hexLabel.textContent = seedHex.toUpperCase();
    }

    const swatches = rampCard.querySelectorAll('.ramp-swatch');
    if (swatches && swatches.length === 11) {
      const ramp = buildRamp(seedHex, isNeutral);
      const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
      swatches.forEach((swatch, idx) => {
        swatch.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-${steps[idx]}, ${ramp[idx]})` : ramp[idx];
      });
    }
  }

  const STATUS_ITEMS = [
    { key: "success", nameZh: "成功", nameEn: "Success", defaultHex: "#15803d" },
    { key: "warning", nameZh: "警告", nameEn: "Warning", defaultHex: "#b45309" },
    { key: "error",   nameZh: "錯誤", nameEn: "ERROR",  defaultHex: "#b91c1c" },
    { key: "info",    nameZh: "資訊", nameEn: "Info",    defaultHex: "#0369a1" }
  ];

  function update(state) {
    if (!state || !state.colors) return;
    const { colors } = state;
    const semMap = colors.semantic || {};

    const list = [];

    /* 1. 中性色 (最上方) */
    if (colors.neutral) {
      list.push({
        nameZh: "中性",
        nameEn: "Neutral",
        seed: colors.neutral.seed,
        prefix: "ds-color-neutral",
        isNeutral: true
      });
    }

    /* 2. 超連結色 (中性色下方) */
    const linkSeed = colors.link?.seed || colors.primaries?.[0]?.seed || "#7F5539";
    list.push({
      nameZh: "連結",
      nameEn: "Link",
      seed: linkSeed,
      prefix: "ds-color-link",
      isNeutral: false
    });

    /* 3. 狀態顏色 (成功、警告、刪除、資訊) */
    STATUS_ITEMS.forEach(item => {
      list.push({
        nameZh: item.nameZh,
        nameEn: item.nameEn,
        seed: semMap[item.key] || item.defaultHex,
        prefix: `ds-color-semantic-${item.key}`,
        isNeutral: false
      });
    });

    if (statusContainer) {
      if (statusContainer.children.length === list.length) {
        list.forEach((item, idx) => {
          updateRampCard(statusContainer.children[idx], item.nameZh, item.nameEn, item.seed, item.prefix, item.isNeutral);
        });
      } else {
        statusContainer.innerHTML = '';
        list.forEach(item => {
          statusContainer.appendChild(renderRampCard(item.nameZh, item.nameEn, item.seed, item.prefix, item.isNeutral));
        });
      }
    }
  }

  if (store) {
    update(store.getState());
  }

  return { card, update };
}

  });

  define("./src/preview/cards/cardType.js", function(__require, exports) {
const { TYPE_SCALE_TABLE } = __require("../../tokens/derive.js");
exports.createTypeCard = createTypeCard; function createTypeCard() {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-type';
  card.id = 'card-type';

  card.innerHTML = `
    <div class="preview-card-body type-ladder" id="type-ladder-container"></div>
  `;

  const container = card.querySelector('#type-ladder-container');

  for (const step of Object.keys(TYPE_SCALE_TABLE)) {
    const row = document.createElement('div');
    row.className = 'type-ladder-row';

    const sample = document.createElement('span');
    sample.className = 'type-ladder-sample';
    sample.innerHTML = '<span class="lang-zh">範例文字</span><span class="lang-sep"> / </span><span class="lang-en">Example Text</span>';
    sample.style.fontFamily = step.startsWith('headline')
      ? 'var(--ds-font-heading)'
      : step.startsWith('label')
      ? 'var(--ds-font-label)'
      : 'var(--ds-font-body)';
    sample.style.fontSize = `var(--ds-fs-${step})`;
    sample.style.fontWeight = `var(--ds-fw-${step})`;
    sample.style.lineHeight = `var(--ds-lh-${step})`;
    sample.style.letterSpacing = `var(--ds-ls-${step})`;

    const meta = document.createElement('span');
    meta.className = 'type-ladder-meta';
    meta.dataset.step = step;
    meta.textContent = step;

    row.appendChild(sample);
    row.appendChild(meta);
    container.appendChild(row);
  }

  return card;
}
  });

  define("./src/preview/previewRoot.js", function(__require, exports) {
/* 預覽根容器與網格初始化模組 */
const { createColorsCard } = __require("./cards/cardColors.js");
const { createTypeCard } = __require("./cards/cardType.js");
const { createButtonsCard } = __require("./cards/cardButtons.js");
const { createFormsCard } = __require("./cards/cardForms.js");
const { createColorCombosCard } = __require("./cards/cardColorCombos.js");

exports.initPreviewRoot = initPreviewRoot; function initPreviewRoot(containerEl, store) {
  if (!containerEl) return null;

  /* 預覽 DOM 只在啟動時建立一次 (SPEC 3.2 Rule 1) */
  const wrapper = document.createElement("div");
  wrapper.className = "preview-container";

  const grid = document.createElement("div");
  grid.className = "preview-grid";

  /* 第一列：色彩區塊（全寬） */
  const colorsCard = createColorsCard(store);
  grid.appendChild(colorsCard.card || colorsCard);

  /* 第二列：色彩組合區塊（全寬） */
  const combosCard = createColorCombosCard();
  grid.appendChild(combosCard.card || combosCard);

  /* 第三列：字級區塊、按鈕區塊、表單區塊並排 */
  const row3Wrapper = document.createElement("div");
  row3Wrapper.className = "preview-row-3-wrapper";
  row3Wrapper.style.gridColumn = "1 / -1";
  row3Wrapper.style.display = "flex";
  row3Wrapper.style.gap = "var(--ds-gutter, 20px)";
  row3Wrapper.style.alignItems = "stretch";

  /* 字級卡片 */
  row3Wrapper.appendChild(createTypeCard());

  /* 按鈕卡片 */
  const buttonsCard = createButtonsCard(store);
  row3Wrapper.appendChild(buttonsCard.card || buttonsCard);

  /* 表單卡片 */
  const formsCard = createFormsCard();
  row3Wrapper.appendChild(formsCard.card || formsCard);

  grid.appendChild(row3Wrapper);

  wrapper.appendChild(grid);
  containerEl.appendChild(wrapper);

  function updateOverlay(state) {
    const cols = state?.layout?.gridColumns || 16;
    const gutter = state?.layout?.gutter ?? 20;

    grid.setAttribute("data-columns", String(cols));
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gap = `${gutter}px`;
  }

  updateOverlay(store ? store.getState() : {});

  return {
    wrapper,
    grid,
    update: (state) => {
      if (colorsCard.update) colorsCard.update(state);
      if (combosCard.update) combosCard.update(state);
      if (buttonsCard.update) buttonsCard.update(state);
      if (formsCard.update) formsCard.update(state);
      updateOverlay(state);
    }
  };
}

/* 載入轉圈控制器：延遲 120ms 顯示，若 120ms 內完成則完全不閃爍 (SPEC 3.2) */
exports.createLoadingIndicator = createLoadingIndicator; function createLoadingIndicator(loadingEl) {
  let timer = null;

  return {
    start() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (loadingEl) loadingEl.classList.add("show");
      }, 120);
    },
    end() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (loadingEl) loadingEl.classList.remove("show");
    }
  };
}

/* 全螢幕切換功能（原生 Fullscreen API ＋ CSS 降級備援，SPEC 9.6） */
exports.toggleFullscreen = toggleFullscreen; function toggleFullscreen(targetEl) {
  if (!document.fullscreenElement && !targetEl.classList.contains("is-fullscreen-fallback")) {
    if (targetEl.requestFullscreen) {
      targetEl.requestFullscreen().catch(() => {
        targetEl.classList.add("is-fullscreen-fallback");
      });
    } else {
      targetEl.classList.add("is-fullscreen-fallback");
    }
  } else {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        targetEl.classList.remove("is-fullscreen-fallback");
      });
    } else {
      targetEl.classList.remove("is-fullscreen-fallback");
    }
  }
}

  });

  define("./src/tokens/apply.js", function(__require, exports) {
/**
 * Token 注入器（完全遵循 SPEC 第 3.2 節規則 2 與規則 3）
 * 僅允許 el.style.setProperty 操作，將 token 作用域限定於 #preview-root，絕不碰 :root
 */

exports.applyTokens = applyTokens; function applyTokens(previewRootEl, tokenMap) {
  if (!previewRootEl || !tokenMap) return;

  for (const [propName, propValue] of Object.entries(tokenMap)) {
    previewRootEl.style.setProperty(propName, propValue);
  }
}

  });

  define("./src/tokens/derive.js", function(__require, exports) {
/* Token 推導引擎（分片記憶化，完全遵循 SPEC 第 3.2、6.7、8.3 節與參數化旋鈕架構） */
const { TOKEN_NAMES } = __require("./names.js");
const { hexToOklch, oklchToHex, clamp01 } = __require("../color/convert.js");
const { gamutMap } = __require("../color/gamut.js");
const { buildRamp, RAMP_STEPS } = __require("../color/ramp.js");
const { pickOnColor, weakenToLimit, strengthenToMeet, shiftOf } = __require("../color/contrast.js");

/* 9 階字級階層標準冪次與預設值（SPEC 8.3） */
const TYPE_SCALE_TABLE = exports.TYPE_SCALE_TABLE = {
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
exports.deriveSurfaceColors = deriveSurfaceColors; function deriveSurfaceColors(neutralRamp, surfaceTokens, mode) {
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
exports.deriveTokens = deriveTokens; function deriveTokens(state) {
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

  });

  define("./src/tokens/names.js", function(__require, exports) {
/**
 * CSS 變數名稱常數表（完全遵循 SPEC 第 4 節與附錄 B）
 * 單一事實來源，禁止在程式碼中直接使用字串字面量
 */

const TOKEN_NAMES = exports.TOKEN_NAMES = {
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

  });

  define("./src/url/codec.js", function(__require, exports) {
/* AppState ↔ URL Hash 編解碼器（完全遵循 SPEC 第 13.3 節） */

/* Uint8Array → Base64URL 字串 */
exports.base64UrlFromBytes = base64UrlFromBytes; function base64UrlFromBytes(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = (typeof btoa !== "undefined")
    ? btoa(binary)
    : Buffer.from(binary, "binary").toString("base64");

  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* Base64URL 字串 → Uint8Array */
exports.base64UrlToBytes = base64UrlToBytes; function base64UrlToBytes(base64Url) {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = (typeof atob !== "undefined")
    ? atob(base64)
    : Buffer.from(base64, "base64").toString("binary");

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/* 字串直接 Base64URL */
exports.base64UrlEncode = base64UrlEncode; function base64UrlEncode(str) {
  const bytes = (typeof TextEncoder !== "undefined")
    ? new TextEncoder().encode(str)
    : Buffer.from(str, "utf-8");
  return base64UrlFromBytes(bytes);
}

exports.base64UrlDecode = base64UrlDecode; function base64UrlDecode(base64Url) {
  const bytes = base64UrlToBytes(base64Url);
  return (typeof TextDecoder !== "undefined")
    ? new TextDecoder().decode(bytes)
    : Buffer.from(bytes).toString("utf-8");
}

/* 狀態編碼：排除 ui 切片以節省體積 (SPEC 13.3) */
exports.encodeState = encodeState; async function encodeState(state) {
  const { ui, ...persistedState } = state;
  const json = JSON.stringify(persistedState);

  if (typeof CompressionStream === "undefined") {
    return "r" + base64UrlEncode(json); /* raw 回退 */
  }

  try {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
    const buf = await new Response(stream).arrayBuffer();
    return "g" + base64UrlFromBytes(new Uint8Array(buf));
  } catch {
    return "r" + base64UrlEncode(json);
  }
}

/* 狀態解碼 */
exports.decodeState = decodeState; async function decodeState(encoded) {
  if (!encoded || encoded.length < 2) return null;
  const format = encoded[0];
  const payload = encoded.slice(1);

  try {
    if (format === "r") {
      const json = base64UrlDecode(payload);
      return JSON.parse(json);
    } else if (format === "g") {
      const bytes = base64UrlToBytes(payload);
      if (typeof DecompressionStream !== "undefined") {
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
        const text = await new Response(stream).text();
        return JSON.parse(text);
      }
    }
  } catch (err) {
    console.warn("State decode failed, fallback to defaultState:", err);
  }
  return null;
}

  });

  /* 啟動 main.js */
  requireModule("./index.html", "./src/main.js");
})();
