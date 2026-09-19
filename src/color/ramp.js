/**
 * 11 階色階生成模組（純函式，零 DOM 依賴）
 * 實作自適應端點與錨定重映射（完全遵循 SPEC 第 6.5 節）
 */
import { hexToOklch, oklchToHex } from "./convert.js";
import { gamutMap } from "./gamut.js";

export const RAMP_STEPS = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
export const BASE_L = [0.971, 0.936, 0.885, 0.808, 0.714, 0.624, 0.541, 0.462, 0.382, 0.295, 0.223];
export const ANCHOR = 5; /* 索引 5 = 500 階 */
export const L_HI = 0.980; /* 50 階的標準亮度上限 */
export const L_LO = 0.150; /* 950 階的標準亮度下限 */
export const MIN_GAP = 0.012; /* 相鄰階層的最小 L 間隔 */

/* 自適應端點：確保極端種子色不會發生色階塌陷與逆序 */
export function endpoints(Lseed) {
  return {
    hi: Math.min(1.0, Math.max(L_HI, Lseed + 5 * MIN_GAP)),
    lo: Math.max(0.0, Math.min(L_LO, Lseed - 5 * MIN_GAP)),
  };
}

/* 亮度重映射：保留曲線形狀並釘牢 500 階錨點 */
export function remapL(Lseed) {
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
export const taper = (L) => 1 - Math.pow(Math.abs(2 * L - 1), 2.2);

/* 生成 11 階色階陣列 */
export function buildRamp(seedHex, isNeutral = false) {
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
