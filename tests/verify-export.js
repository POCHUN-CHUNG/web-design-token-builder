/* 匯出與無障礙自動化驗證腳本（完全對齊參數化旋鈕系統架構） */
import { defaultState } from "../src/core/defaultState.js";
import { stateToDtcg } from "../src/export/toDtcg.js";
import { toYaml } from "../src/export/toYaml.js";
import { runA11yAudit } from "../src/a11y/audit.js";
import { PRESETS } from "../src/data/presets.js";
import { encodeState, decodeState } from "../src/url/codec.js";

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

console.log("=== 1. 驗證 7 組 Presets 初始狀態 100% 通過 WCAG AA ===");
for (const preset of PRESETS) {
  const audit = runA11yAudit(preset.state);
  assert(audit.pass, `Preset [${preset.id}] 必須 100% 通過 WCAG AA (未通過數: ${audit.failCount})`);
  if (!audit.pass) {
    console.error("未通過項:", audit.results.filter(r => !r.pass));
  }
}

console.log("=== 2. 驗證 DTCG Token 參數化旋鈕結構合規性 ===");
const dtcg = stateToDtcg(defaultState);
assert(dtcg.$description.length > 0, "DTCG 包含 $description");
assert(dtcg.meta.tokenFormat === "w3c-dtcg", "tokenFormat 為 w3c-dtcg");
assert(dtcg.color.$type === "color", "color 群組具有 $type: color");
assert(dtcg.typography.families.$type === "fontFamily", "fontFamily 群組具有 $type: fontFamily");
assert(dtcg.appearance.radius.$type === "dimension", "appearance.radius 群組具有 $type: dimension");
assert(dtcg.typography.$type === "typography", "typography 群組具有 $type: typography");

/* 驗證 elevation 參數化深度旋鈕（預設為 glass 風格） */
assert(dtcg.appearance.elevation !== undefined, "包含 appearance.elevation 區塊");
assert(dtcg.appearance.elevation.strategy.$value === "glass", "預設 elevation.strategy 為 glass");
assert(dtcg.appearance.elevation.levels["level-1"].$value.blur.value === 3, "elevation.levels level-1 blur 為 3px");
assert(dtcg.appearance.elevation.levels["level-5"].$value.blur.value === 48, "elevation.levels level-5 blur 為 48px");

/* 驗證 shape 形狀旋鈕 */
assert(dtcg.appearance.shape !== undefined, "包含 appearance.shape 區塊");
assert(dtcg.appearance.shape.cornerStrategy.$value === "rounded-mixed", "預設 shape.cornerStrategy 為 rounded-mixed");
assert(dtcg.appearance.shape.borderStrategy.$value === "hairline", "預設 shape.borderStrategy 為 hairline");
assert(dtcg.appearance.shape.borderWidth.$value.value === 1, "預設 shape.borderWidth 為 1px");

/* 驗證 Component 結構 */
assert(dtcg.appearance.component !== undefined, "包含 appearance.component 區塊");
assert(dtcg.appearance.component.card.elevation.$value === "{appearance.elevation.levels.level-1}", "card elevation 使用 DTCG alias");

console.log("=== 3. 驗證 YAML 序列化輸出 ===");
const yamlStr = toYaml(dtcg);
assert(yamlStr.includes("$description:"), "YAML 包含 $description");
assert(yamlStr.includes("tokenFormat:"), "YAML 包含 tokenFormat");
assert(yamlStr.includes("primary:"), "YAML 包含 primary 色階");
assert(yamlStr.includes("elevation:"), "YAML 包含 elevation");
assert(yamlStr.includes("shape:"), "YAML 包含 shape");

console.log("=== 4. 驗證 URL 編解碼 (State Codec) 往返 ===");
async function testCodec() {
  const testState = { ...defaultState, brand: { productName: "Test Brand" } };
  const encoded = await encodeState(testState);
  assert(typeof encoded === "string" && encoded.length > 0, "狀態編碼回傳非空字串");
  const decoded = await decodeState(encoded);
  assert(decoded !== null, "解碼成功回傳物件");
  assert(decoded.brand.productName === testState.brand.productName, "產品名稱往返相符");
  assert(decoded.colors.primaries[0].seed === testState.colors.primaries[0].seed, "種子色往返相符");
  assert(decoded.elevation.strategy === testState.elevation.strategy, "深度策略往返相符");
}

await testCodec();

console.log(`\n驗證結果：通過 ${passed} 項，失敗 ${failed} 項`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 匯出與無障礙引擎全部測試通過！");
}
