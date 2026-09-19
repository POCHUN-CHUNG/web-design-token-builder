/**
 * sRGB 色域映射（純函式，零 DOM 依賴）
 * 固定 L 與 H，二分搜尋降低 C 直到落回色域內（完全遵循 SPEC 第 6.4 節）
 */
import { oklabToLinearRgb } from "./convert.js";

export function inGamut(L, C, H) {
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

export function gamutMap(L, C, H) {
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
