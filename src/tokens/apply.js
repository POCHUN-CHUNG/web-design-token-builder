/**
 * Token 注入器（完全遵循 SPEC 第 3.2 節規則 2 與規則 3）
 * 僅允許 el.style.setProperty 操作，將 token 作用域限定於 #preview-root，絕不碰 :root
 */

export function applyTokens(previewRootEl, tokenMap) {
  if (!previewRootEl || !tokenMap) return;

  for (const [propName, propValue] of Object.entries(tokenMap)) {
    previewRootEl.style.setProperty(propName, propValue);
  }
}
