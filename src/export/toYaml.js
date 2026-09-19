/* 純原生 YAML 序列化工具（純函式，零依賴，完全遵循 SPEC 第 4 節與第 11.2 節） */

export function toYaml(obj, indent = 0) {
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
