/* AppState ↔ URL Hash 編解碼器（完全遵循 SPEC 第 13.3 節） */

/* Uint8Array → Base64URL 字串 */
export function base64UrlFromBytes(bytes) {
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
export function base64UrlToBytes(base64Url) {
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
export function base64UrlEncode(str) {
  const bytes = (typeof TextEncoder !== "undefined")
    ? new TextEncoder().encode(str)
    : Buffer.from(str, "utf-8");
  return base64UrlFromBytes(bytes);
}

export function base64UrlDecode(base64Url) {
  const bytes = base64UrlToBytes(base64Url);
  return (typeof TextDecoder !== "undefined")
    ? new TextDecoder().decode(bytes)
    : Buffer.from(bytes).toString("utf-8");
}

/* 狀態編碼：排除 ui 切片以節省體積 (SPEC 13.3) */
export async function encodeState(state) {
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
export async function decodeState(encoded) {
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
