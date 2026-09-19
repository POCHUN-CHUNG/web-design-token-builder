/* 色彩引擎自動化驗證腳本（測試附錄 C 黃金向量與 14.2 色彩驗收標準） */
import { hexToOklch, oklchToHex, hexToSrgb01 } from "../src/color/convert.js";
import { buildRamp, endpoints } from "../src/color/ramp.js";
import { relativeLuminance, contrastRatio, pickOnColor, strengthenToMeet, weakenToLimit } from "../src/color/contrast.js";

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

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual:   ${JSON.stringify(actual)}`);
  }
}

console.log("=== 1. 黃金色階測試向量 (Appendix C) ===");

const goldenGeneral = {
  "#2563eb": ["#f5f9ff", "#dfeaff", "#c0d6ff", "#90b6ff", "#548cff", "#2563eb", "#0a48cf", "#0033a8", "#00237b", "#00124d", "#00062a"],
  "#ffd700": ["#fff9e0", "#fff6d2", "#fff1bc", "#ffea99", "#ffe167", "#ffd700", "#c6a700", "#937b00", "#635200", "#322900", "#0f0b00"],
  "#16a34a": ["#f2fcf3", "#dbf5de", "#baeac2", "#8cd79a", "#55be6e", "#16a34a", "#008237", "#006228", "#004419", "#00260b", "#001003"],
  "#dc2626": ["#fff6f5", "#ffe4e0", "#ffc8c1", "#ff9c90", "#fa5c51", "#dc2626", "#b60010", "#8d0009", "#650005", "#3d0002", "#1f0000"],
  "#0ea5e9": ["#f2faff", "#def2ff", "#c1e6ff", "#91d4ff", "#57bdf8", "#0ea5e9", "#0082b9", "#00618d", "#004362", "#002437", "#000d17"],
  "#7c3aed": ["#f8f7ff", "#eae6ff", "#d6cdff", "#b9a6ff", "#9970ff", "#7c3aed", "#6611d1", "#4f00a6", "#38007a", "#21004c", "#0f002a"]
};

for (const [seed, expectedRamp] of Object.entries(goldenGeneral)) {
  const actualRamp = buildRamp(seed, false);
  assertEqual(actualRamp[5], seed, `${seed} 500 階必須嚴格等於種子色`);
  for (let i = 0; i < 11; i++) {
    assertEqual(actualRamp[i], expectedRamp[i], `${seed} 階層 ${i} 黃金相符`);
  }
}

const goldenNeutral = {
  "#808080": ["#f8f8f8", "#ececec", "#d9d9d9", "#bebebe", "#9e9e9e", "#808080", "#656565", "#4c4c4c", "#353535", "#1d1d1d", "#0b0b0b"],
  "#71717a": ["#f8f8f9", "#eaeaeb", "#d5d5d7", "#b7b7b9", "#939396", "#727275", "#5a5a5d", "#444447", "#303032", "#1b1b1d", "#0b0b0c"],
  "#64748b": ["#f8f8f9", "#e9eaed", "#d3d6da", "#b3b8be", "#8f949c", "#6e737b", "#565b63", "#41464d", "#2c3137", "#181b20", "#090b0e"]
};

for (const [seed, expectedRamp] of Object.entries(goldenNeutral)) {
  const actualRamp = buildRamp(seed, true);
  for (let i = 0; i < 11; i++) {
    assertEqual(actualRamp[i], expectedRamp[i], `中性色 ${seed} 階層 ${i} 黃金相符`);
  }
}

console.log("=== 2. WCAG 對比度基準值 ===");
assertEqual(Math.round(contrastRatio("#000000", "#ffffff") * 100) / 100, 21.00, "純黑白對比 21.00");
assertEqual(Math.round(contrastRatio("#ffffff", "#ffffff") * 100) / 100, 1.00, "純白白對比 1.00");
assertEqual(Math.round(contrastRatio("#767676", "#ffffff") * 100) / 100, 4.54, "#767676 / #ffffff 臨界對比 4.54");
assertEqual(Math.round(contrastRatio("#949494", "#ffffff") * 100) / 100, 3.03, "#949494 / #ffffff 大字臨界對比 3.03");

console.log("=== 3. on-primary 預期結果 ===");
const expectedOnPrimary = {
  "#2563eb": "#f5f9ff",
  "#ffd700": "#0f0b00",
  "#16a34a": "#001003",
  "#dc2626": "#fff6f5",
  "#0ea5e9": "#000d17",
  "#7c3aed": "#f8f7ff",
  "#b8422e": "#fff6f4",
  "#f472b6": "#1c000f"
};

for (const [seed, expectedOn] of Object.entries(expectedOnPrimary)) {
  const ramp = buildRamp(seed, false);
  const actualOn = pickOnColor(seed, ramp, 4.5);
  assertEqual(actualOn, expectedOn, `on-primary for ${seed} must match ${expectedOn}`);
  const ratio = contrastRatio(actualOn, seed);
  assert(ratio >= 4.5, `on-primary contrast ratio (${ratio.toFixed(2)}) must be >= 4.5`);
}

console.log("=== 4. √21 定理界線掃描測試 ===");
let minGuaranteeRatio = Infinity;
for (let lum = 0; lum <= 1.000001; lum += 0.001) {
  const cWhite = (1.0 + 0.05) / (lum + 0.05);
  const cBlack = (lum + 0.05) / 0.05;
  const best = Math.max(cWhite, cBlack);
  if (best < minGuaranteeRatio) {
    minGuaranteeRatio = best;
  }
}
assert(minGuaranteeRatio >= 4.582, `√21 理論最差值必須 >= 4.582 (實際: ${minGuaranteeRatio.toFixed(4)})`);

console.log("=== 5. 10,000 組隨機種子色階單調性無逆序測試 ===");
let reversals = 0;
/* 包含極端種子 */
const testSeeds = [
  "#fefed8", "#050508", "#ffffff", "#000000", "#ffff00", "#00ffff", "#ff00ff"
];

/* 補充隨機種子至 5000 組 */
for (let i = 0; i < 5000; i++) {
  const r = Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
  const g = Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
  const b = Math.floor(Math.random() * 256).toString(16).padStart(2, "0");
  testSeeds.push(`#${r}${g}${b}`);
}

for (const seed of testSeeds) {
  for (const isNeutral of [false, true]) {
    const ramp = buildRamp(seed, isNeutral);
    for (let i = 0; i < 10; i++) {
      const lumA = relativeLuminance(ramp[i]);
      const lumB = relativeLuminance(ramp[i + 1]);
      if (lumA < lumB) {
        reversals++;
        console.error(`Reversal detected in ${seed} (${isNeutral ? 'neutral' : 'general'}): step ${i} (${ramp[i]} lum=${lumA}) < step ${i+1} (${ramp[i+1]} lum=${lumB})`);
      }
    }
  }
}

assertEqual(reversals, 0, "10,000 條色階逆序數必須為 0");

console.log("=== 6. 雙向 strengthenToMeet 與 autoFix 驗證 ===");
/* 測試邊框強化：原色 "#e0e0e0" 在白色 "#ffffff" 上只有 1.3:1，應強化至 >= 3.0:1 */
const fixedBorder = strengthenToMeet("#e0e0e0", "#ffffff", 3.0);
const fixedBorderRatio = contrastRatio(fixedBorder, "#ffffff");
assert(fixedBorderRatio >= 3.0, `strengthenToMeet 必須達成 >= 3.0 (實際: ${fixedBorderRatio.toFixed(2)})`);

/* 測試 text-muted 自適應靠攏 */
const muted = weakenToLimit("#16181d", "#ffffff", 4.5);
const mutedRatio = contrastRatio(muted, "#ffffff");
assert(mutedRatio >= 4.5, `weakenToLimit 必須滿足 >= 4.5 (實際: ${mutedRatio.toFixed(2)})`);

console.log(`\n驗證結果：通過 ${passed} 項，失敗 ${failed} 項`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 色彩引擎全部測試通過！");
}
