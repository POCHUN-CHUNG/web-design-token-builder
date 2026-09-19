/**
 * WCAG 相對亮度、對比度計算與自適應對比調整（純函式，零 DOM 依賴）
 * 完全遵循 SPEC 第 6.7、7.1、7.2、7.5 與 7.9 節
 */
import { hexToSrgb01, hexToOklch, oklchToHex, clamp01 } from "./convert.js";
import { gamutMap } from "./gamut.js";

/* WCAG 2.x 相對亮度（嚴格使用 0.03928 門檻） */
export function relativeLuminance(hex) {
  const [r, g, b] = hexToSrgb01(hex).map(c =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* WCAG 對比度比值（1.0 ~ 21.0） */
export function contrastRatio(hexA, hexB) {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

/* 根據背景亮度，挑選合適的文字顏色 (暗底用亮字，亮底用暗字) */
export function pickTextBasedOnBg(bgHex, darkOption, lightOption) {
  const { L } = hexToOklch(bgHex);
  // L 值介於 0~1 之間。這裡設定 0.65：大於 0.65 算亮底(用黑字)，小於等於 0.65 算暗底(用白字)
  // 您可以調整此數值 (例如改為 0.60 或 0.70) 來改變系統判定暗色或亮色的基準點
  return L > 0.65 ? darkOption : lightOption;
}

/* 兩 hex 間的 OKLCH L 差距 */
export function shiftOf(hexA, hexB) {
  return Math.abs(hexToOklch(hexA).L - hexToOklch(hexB).L);
}

/* text-muted 自適應推導：往背景靠攏，逼近下限但仍高於 threshold */
export function weakenToLimit(baseHex, bgHex, threshold = 4.5, maxShift = 0.30) {
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
export function strengthenToMeet(baseHex, bgHex, threshold = 3.0, maxShift = 1.0) {
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
export const autoFix = strengthenToMeet;
