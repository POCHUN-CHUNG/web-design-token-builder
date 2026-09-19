/**
 * Google Fonts 動態載入器（完全遵循 SPEC 第 8.5 節）
 * 快取已載入的 family:weights，避免重複請求
 */
const loadedSet = new Set();

export async function ensureFont(family, weights = [400, 500, 600, 700]) {
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
