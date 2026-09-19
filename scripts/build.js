/**
 * 零依賴打包工具（純 Node.js 原生實作，完全無需 npm 安裝任何套件）
 * 將 src/ 下所有 ES 模組封裝為單一獨立 dist/bundle.js，讓使用者可直接透過 file:/// 開啟 index.html
 */
import fs from "fs";
import path from "path";

const srcDir = path.resolve("src");
const distDir = path.resolve("dist");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

function getAllFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(full));
    } else if (file.endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

const allFiles = getAllFiles(srcDir);
const modules = {};

for (const filePath of allFiles) {
  const relPath = "./" + path.relative(process.cwd(), filePath).replace(/\\/g, "/");
  let content = fs.readFileSync(filePath, "utf-8");

  /* 轉換 import 與 export 為簡易模組載入器格式 */
  modules[relPath] = content;
}

/* 產生單一 bundle.js */
let bundleCode = `// Build Your Design Systems - Standalone Bundle for file:/// compatibility
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
`;

for (const [modPath, originalCode] of Object.entries(modules)) {
  /**
   * 將 ES export/import 轉為模組匯出
   * 1. import { a, b } from "path"; -> const { a, b } = require("path");
   * 2. import * as x from "path"; -> const x = require("path");
   * 3. export const x = ... -> const x = exports.x = ...
   * 4. export function x() ... -> exports.x = x; function x() ...
   * 5. export { a, b } -> Object.assign(exports, { a, b });
   */
  let code = originalCode;

  /* 替換 import */
  code = code.replace(/import\s+\*\s+as\s+([a-zA-Z0-9_$]+)\s+from\s+["']([^"']+)["'];?/g, (m, name, p) => {
    return `const ${name} = __require("${p}");`;
  });

  code = code.replace(/import\s+{([^}]+)}\s+from\s+["']([^"']+)["'];?/g, (m, imports, p) => {
    /* 處理 as */
    const cleanImports = imports.split(",").map(i => {
      const parts = i.trim().split(/\s+as\s+/);
      return parts.length === 2 ? `${parts[0].trim()}: ${parts[1].trim()}` : parts[0].trim();
    }).filter(Boolean).join(", ");
    return `const { ${cleanImports} } = __require("${p}");`;
  });

  /* 替換 export const / let / var */
  code = code.replace(/export\s+(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/g, (m, type, name) => {
    return `${type} ${name} = exports.${name} =`;
  });

  /* 替換 export function */
  code = code.replace(/export\s+function\s+([a-zA-Z0-9_$]+)/g, (m, name) => {
    return `exports.${name} = ${name}; function ${name}`;
  });

  /* 替換 export async function */
  code = code.replace(/export\s+async\s+function\s+([a-zA-Z0-9_$]+)/g, (m, name) => {
    return `exports.${name} = ${name}; async function ${name}`;
  });

  /* 替換 export { a, b } */
  code = code.replace(/export\s+{([^}]+)};?/g, (m, exportsList) => {
    const pairs = exportsList.split(",").map(e => {
      const parts = e.trim().split(/\s+as\s+/);
      const src = parts[0].trim();
      const target = parts.length === 2 ? parts[1].trim() : src;
      return `${target}: typeof ${src} !== "undefined" ? ${src} : undefined`;
    }).filter(Boolean).join(", ");
    return `Object.assign(exports, { ${pairs} });`;
  });

  bundleCode += `
  define("${modPath}", function(__require, exports) {
${code}
  });
`;
}

bundleCode += `
  /* 啟動 main.js */
  requireModule("./index.html", "./src/main.js");
})();
`;

fs.writeFileSync(path.join(distDir, "bundle.js"), bundleCode, "utf-8");
console.log("Successfully generated dist/bundle.js (" + bundleCode.length + " bytes)");
