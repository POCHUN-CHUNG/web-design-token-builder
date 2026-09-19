import { contrastRatio, pickOnColor, autoFix } from "../color/contrast.js";
import { buildRamp } from "../color/ramp.js";
import { deriveSurfaceColors } from "../tokens/derive.js";

export function runA11yAudit(state, targetMode = null) {
  const results = [];

  /* 輔助檢查單一配對 (AA 門檻與 AAA 門檻) */
  function checkPair(name, fgHex, bgHex, aaThreshold, aaaThreshold, mode, type = "normal") {
    const ratio = contrastRatio(fgHex, bgHex);
    const passAA = ratio >= aaThreshold;
    const passAAA = ratio >= aaaThreshold;
    results.push({
      name,
      fg: fgHex,
      bg: bgHex,
      ratio: Math.round(ratio * 100) / 100,
      threshold: aaThreshold,
      aaThreshold,
      aaaThreshold,
      mode,
      type,
      pass: passAA,
      passAA,
      passAAA
    });
  }

  /* 依序檢查指定的模式（若無指定則同時檢查 light 與 dark） */
  const modes = targetMode ? [targetMode] : ["light", "dark"];

  for (const mode of modes) {
    const currentColors = state.colors[mode];
    if (!currentColors) continue;

    const neutralRamp = buildRamp(currentColors.neutral.seed, true);
    const surfaces = deriveSurfaceColors(neutralRamp, currentColors.surface, mode);

    /* 1. 一般主要文字 text / bg (AA 4.5:1, AAA 7.0:1) */
    checkPair("text / bg", surfaces.text, surfaces.bg, 4.5, 7.0, mode, "text");

    /* 2. 一般主要文字 text / surface (AA 4.5:1, AAA 7.0:1) */
    checkPair("text / surface", surfaces.text, surfaces.surface, 4.5, 7.0, mode, "text");

    /* 3. 次要文字 text-muted / bg (AA 4.5:1, AAA 4.5:1) */
    checkPair("text-muted / bg", surfaces.textMuted, surfaces.bg, 4.5, 4.5, mode, "text");

    /* 4. 次要文字 text-muted / surface (AA 4.5:1, AAA 4.5:1) */
    checkPair("text-muted / surface", surfaces.textMuted, surfaces.surface, 4.5, 4.5, mode, "text");

    /* 5. 按鈕主要文字 on-primary / primary.500 (AA 4.5:1, AAA 7.0:1) */
    if (currentColors.primaries && currentColors.primaries.length > 0) {
      const primaryRamp = buildRamp(currentColors.primaries[0].seed, false);
      const onPrimary = pickOnColor(primaryRamp[5], primaryRamp, 4.5);
      checkPair("on-primary / primary.500", onPrimary, primaryRamp[5], 4.5, 7.0, mode, "text");
    }

    /* 6. 強邊框 border-strong / bg (AA 3.0:1, AAA 3.0:1) */
    checkPair("border-strong / bg", surfaces.borderStrong, surfaces.bg, 3.0, 3.0, mode, "non-text");

    /* 7. 焦點環 primary.500 / bg (AA 3.0:1, AAA 4.5:1) */
    if (currentColors.primaries && currentColors.primaries.length > 0) {
      const primary500 = buildRamp(currentColors.primaries[0].seed, false)[5];
      checkPair("primary.500 / bg", primary500, surfaces.bg, 3.0, 4.5, mode, "non-text");
    }

    /* 8-11. 各語意色 semantic.* / bg (AA 3.0:1, AAA 4.5:1) */
    if (currentColors.semantic) {
      for (const [key, seed] of Object.entries(currentColors.semantic)) {
        checkPair(`semantic.${key} / bg`, seed, surfaces.bg, 3.0, 4.5, mode, "non-text");
      }
    }

    /* 12+. 各輔助色 accent-n.500 / bg (AA 3.0:1, AAA 4.5:1) */
    if (currentColors.accents) {
      for (const accent of currentColors.accents) {
        const accent500 = buildRamp(accent.seed, false)[5];
        checkPair(`accent.${accent.id}.500 / bg`, accent500, surfaces.bg, 3.0, 4.5, mode, "non-text");
      }
    }
  }

  const failCount = results.filter(r => !r.passAA).length;
  const pass = failCount === 0;
  const allPassAAA = results.every(r => r.passAAA);

  let level = "fail";
  if (allPassAAA) {
    level = "AAA";
  } else if (pass) {
    level = "AA";
  }

  return {
    pass,
    level, /* "AAA" | "AA" | "fail" */
    failCount,
    results
  };
}

export function fixA11yIssues(state) {
  const audit = runA11yAudit(state);
  if (audit.pass) return state;

  const nextColors = JSON.parse(JSON.stringify(state.colors));

  for (const item of audit.results) {
    if (item.pass) continue;
    const mode = item.mode;
    const currentColors = nextColors[mode];
    if (!currentColors) continue;

    if (item.name.startsWith("semantic.")) {
      const key = item.name.split(" / ")[0].replace("semantic.", "").trim();
      if (currentColors.semantic && currentColors.semantic[key]) {
        currentColors.semantic[key] = autoFix(currentColors.semantic[key], item.bg, item.threshold);
      }
    } else if (item.name.startsWith("accent.")) {
      const parts = item.name.split(" / ")[0].split(".");
      const id = parts[1];
      const acc = currentColors.accents?.find(a => a.id === id);
      if (acc) {
        acc.seed = autoFix(acc.seed, item.bg, item.threshold);
      }
    } else if (item.name.includes("primary")) {
      if (currentColors.primaries && currentColors.primaries[0]) {
        currentColors.primaries[0].seed = autoFix(currentColors.primaries[0].seed, item.bg, item.threshold);
      }
    }
  }

  return {
    ...state,
    colors: nextColors
  };
}

