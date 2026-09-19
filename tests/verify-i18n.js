/* 多語系字典完整性驗證腳本 */
import { en } from "../src/i18n/en.js";
import { zhTW } from "../src/i18n/zh-TW.js";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
  }
}

console.log("=== 1. 驗證語系檔案基本結構 ===");
assert(typeof en === "object" && en !== null, "EN 字典應該是對象");
assert(typeof zhTW === "object" && zhTW !== null, "ZH-TW 字典應該是對象");

console.log("=== 2. 驗證所有 Key 是否對齊 ===");
const enKeys = Object.keys(en).sort();
const zhKeys = Object.keys(zhTW).sort();

assert(enKeys.length === zhKeys.length, `EN Key 數量 (${enKeys.length}) 應等於 ZH-TW Key 數量 (${zhKeys.length})`);

const missingInEn = zhKeys.filter(k => !enKeys.includes(k));
const missingInZh = enKeys.filter(k => !zhKeys.includes(k));

assert(missingInEn.length === 0, `EN 不應缺失 Key: ${missingInEn.join(", ")}`);
assert(missingInZh.length === 0, `ZH-TW 不應缺失 Key: ${missingInZh.join(", ")}`);

console.log("=== 3. 驗證特定關鍵字是否存在 ===");
assert(en["topbar.title"] !== undefined, "必須包含 topbar.title");
assert(zhTW["topbar.title"] !== undefined, "必須包含 topbar.title");
assert(en["topbar.export"] !== undefined, "必須包含 topbar.export");
assert(zhTW["topbar.export"] !== undefined, "必須包含 topbar.export");

console.log(`\n驗證結果：通過 ${passed} 項，失敗 ${failed} 項`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 多語系引擎全部測試通過！");
}
