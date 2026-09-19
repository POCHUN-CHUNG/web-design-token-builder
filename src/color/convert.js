/**
 * sRGB ↔ OKLab ↔ OKLCH 雙向精準色彩轉換模組（純函式，零 DOM 依賴）
 * 完全遵循 SPEC 第 6.2 與 6.3 節
 */

export function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/* hex (例如 "#2563eb") → [r, g, b] (0~1) */
export function hexToSrgb01(hex) {
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
export function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/* 線性 RGB → sRGB（伽瑪） */
export function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/* 線性 RGB → OKLab */
export function linearRgbToOklab(r, g, b) {
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
export function oklabToLinearRgb(L, a, bLab) {
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
export function oklabToOklch(L, a, bLab) {
  const C = Math.hypot(a, bLab);
  let H = (Math.atan2(bLab, a) * 180 / Math.PI + 360) % 360;
  if (isNaN(H)) H = 0;
  return { L, C, H };
}

/* OKLCH → OKLab */
export function oklchToOklab(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const bLab = C * Math.sin(hRad);
  return [L, a, bLab];
}

/* hex → OKLCH */
export function hexToOklch(hex) {
  const [r, g, b] = hexToSrgb01(hex);
  const [lr, lg, lb] = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  const [L, a, bLab] = linearRgbToOklab(lr, lg, lb);
  return oklabToOklch(L, a, bLab);
}

/* OKLCH → hex (小寫 6 位 hex) */
export function oklchToHex({ L, C, H }) {
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
