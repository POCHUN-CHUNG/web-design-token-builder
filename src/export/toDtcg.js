/* AppState → W3C DTCG Token 物件轉換器（純函式，零 DOM 依賴，完全遵循 SPEC 第 11.2 節與參數化旋鈕系統架構） */
import { buildRamp, RAMP_STEPS } from "../color/ramp.js";
import { deriveSurfaceColors, TYPE_SCALE_TABLE } from "../tokens/derive.js";
import { runA11yAudit } from "../a11y/audit.js";
import { pickTextBasedOnBg } from "../color/contrast.js";
import { hexToOklch } from "../color/convert.js";

/* 多語語言偵測 (SPEC 11.4) */
export function stateToDtcg(state) {
  const audit = runA11yAudit(state);

  // neutralRamp is derived inside the loop
  // Surface colors are derived inside the modes loop now

  const dtcg = {
    $description: "Design tokens — machine-readable layer only.",
    meta: {
      generator: "Design Token Builder",
      generatedAt: new Date().toISOString(),
      tokenFormat: "w3c-dtcg",
      a11yStatus: audit.pass ? "pass" : "partial",
      a11yFailCount: audit.failCount
    },

    color: {
      $type: "color",
      semantic: {},
      light: {},
      dark: {}
    },

    typography: {
      $type: "typography",
      families: {
        $type: "fontFamily",
        heading: { $value: [state.typography.families.heading, state.typography.families.cjkHeading || state.typography.families.cjk || "Noto Sans TC"] },
        body:    { $value: [state.typography.families.body, state.typography.families.cjkBody || state.typography.families.cjk || "Noto Sans TC"] },
        label:   { $value: [state.typography.families.label || state.typography.families.heading || "Roboto", state.typography.families.cjkLabel || state.typography.families.cjk || "Noto Sans TC"] }
      }
    },

    appearance: {
      radius: {
        $type: "dimension"
      },
      elevation: {},
      shape: {},
      component: {}
    }
  };

  /* 1. 處理顏色 (Light & Dark 模式分離) */
  const modes = ["light", "dark"];
  modes.forEach(mode => {
    const currentColors = state.colors[mode];
    if (!currentColors) return;

    const modeObj = {};

    /* 取得 surface 相關數值以計算反轉字色 */
    const neutralRampForSurface = buildRamp(currentColors.neutral.seed, true);
    const surfaces = deriveSurfaceColors(neutralRampForSurface, currentColors.surface, mode);
    const textPrimary = surfaces.text;
    const textInverted = surfaces.textInverted;
    const lPrimary = hexToOklch(textPrimary).L;
    const textDark = lPrimary < 0.5 ? textPrimary : textInverted;
    const textLight = lPrimary >= 0.5 ? textPrimary : textInverted;

    for (const primary of currentColors.primaries) {
      const ramp = buildRamp(primary.seed, false);
      const rampObj = {};
      RAMP_STEPS.forEach((step, i) => {
        rampObj[step] = { $value: ramp[i].toLowerCase() };
      });
      rampObj["on"] = { $value: pickTextBasedOnBg(ramp[5], textDark, textLight).toLowerCase() };
      modeObj[primary.id] = rampObj;
    }

    const neutralRamp = buildRamp(currentColors.neutral.seed, true);
    const neutralRampObj = {};
    RAMP_STEPS.forEach((step, i) => {
      neutralRampObj[step] = { $value: neutralRamp[i].toLowerCase() };
    });
    neutralRampObj["on"] = { $value: pickTextBasedOnBg(neutralRamp[5], textDark, textLight).toLowerCase() };
    modeObj.neutral = neutralRampObj;

    if (currentColors.link) {
      const linkRamp = buildRamp(currentColors.link.seed, false);
      const linkRampObj = {};
      RAMP_STEPS.forEach((step, i) => {
        linkRampObj[step] = { $value: linkRamp[i].toLowerCase() };
      });
      linkRampObj["on"] = { $value: pickTextBasedOnBg(linkRamp[5], textDark, textLight).toLowerCase() };
      modeObj.link = linkRampObj;
    }

    if (currentColors.accents) {
      for (const accent of currentColors.accents) {
        const ramp = buildRamp(accent.seed, false);
        const rampObj = {};
        RAMP_STEPS.forEach((step, i) => {
          rampObj[step] = { $value: ramp[i].toLowerCase() };
        });
        rampObj["on"] = { $value: pickTextBasedOnBg(ramp[5], textDark, textLight).toLowerCase() };
        modeObj[accent.id] = rampObj;
      }
    }

    if (currentColors.semantic) {
      modeObj.semantic = {};
      for (const [k, seed] of Object.entries(currentColors.semantic)) {
        modeObj.semantic[k] = { 
          $value: seed.toLowerCase(),
          on: { $value: pickTextBasedOnBg(seed, textDark, textLight).toLowerCase() }
        };
      }
    }

    // (surfaces 已經在上方計算過了)
    modeObj.surface = {
      bg:      { $value: surfaces.bg.toLowerCase() },
      btnInvertedBg: { $value: surfaces.btnInvertedBg.toLowerCase() },
      surface: { $value: surfaces.surface.toLowerCase() },
      surfaceRaised: { $value: surfaces.surfaceRaised.toLowerCase() },
      btnSecondaryBg: { $value: surfaces.btnSecondaryBg.toLowerCase() },
      text:    { $value: surfaces.text.toLowerCase() },
      textInverted: { $value: surfaces.textInverted.toLowerCase() },
      textMuted: { $value: surfaces.textMuted.toLowerCase() },
      border:  { $value: surfaces.border.toLowerCase() },
      borderStrong: { $value: surfaces.borderStrong.toLowerCase() },
      btnOutlinedText: { $value: surfaces.btnOutlinedText.toLowerCase() }
    };

    dtcg.color[mode] = modeObj;
  });

  /* 3. 圓角 */
  const shape = state.shape || {};
  const baseRad = shape.radiusBase ?? 12;
  const cornerStrat = shape.cornerStrategy || "rounded-consistent";
  let radSm, radMd, radLg, radXl;

  if (cornerStrat === "sharp") {
    radSm = 0; radMd = 0; radLg = 0; radXl = 0;
  } else if (cornerStrat === "rounded-mixed") {
    radSm = 4; radMd = 6; radLg = 18; radXl = 24;
  } else if (cornerStrat === "rounded-fixed") {
    radSm = baseRad; radMd = baseRad; radLg = baseRad; radXl = baseRad;
  } else {
    radSm = Math.round(baseRad * 0.5);
    radMd = baseRad;
    radLg = Math.round(baseRad * 1.5);
    radXl = baseRad * 2;
  }

  Object.assign(dtcg.appearance.radius, {
    sm:   { $value: { value: radSm, unit: "px" } },
    md:   { $value: { value: radMd, unit: "px" } },
    lg:   { $value: { value: radLg, unit: "px" } },
    xl:   { $value: { value: radXl, unit: "px" } },
    full: { $value: { value: 9999, unit: "px" } }
  });

  /* 4. 字型 9 階 */
  const baseSize = state.typography.scale?.baseSize || 16;
  const ratio = state.typography.scale?.ratio || 1.25;
  const overrides = state.typography.overrides || {};

  for (const [step, def] of Object.entries(TYPE_SCALE_TABLE)) {
    const computedSize = Math.round(baseSize * Math.pow(ratio, def.power));
    const ovr = overrides[step] || {};
    const lsVal = typeof ovr.letterSpacing !== "undefined"
      ? (typeof ovr.letterSpacing === "number" ? ovr.letterSpacing : parseFloat(ovr.letterSpacing) || 0)
      : parseFloat(def.ls) || 0;

    dtcg.typography[step] = {
      $value: {
        fontFamily: step.startsWith("headline") ? "{typography.families.heading}" : "{typography.families.body}",
        fontSize: { value: ovr.fontSize ?? computedSize, unit: "px" },
        fontWeight: ovr.fontWeight ?? def.fw,
        lineHeight: ovr.lineHeight ?? def.lh,
        letterSpacing: { value: lsVal, unit: "em" }
      }
    };
  }

  /* 5. 參數化深度系統 (Elevation) */
  const elev = state.elevation || {};
  const elevLevelsObj = {};
  const levelsSource = elev.levels || {};

  for (let i = 1; i <= 5; i++) {
    const k = `level-${i}`;
    const lvl = levelsSource[k] || {};
    const lvlVal = lvl.$value || lvl;
    elevLevelsObj[k] = {
      $value: {
        offsetX: { value: lvlVal.offsetX?.value ?? lvlVal.offsetX ?? 0, unit: "px" },
        offsetY: { value: lvlVal.offsetY?.value ?? lvlVal.offsetY ?? i * 2, unit: "px" },
        blur:    { value: lvlVal.blur?.value ?? lvlVal.blur ?? i * 6, unit: "px" },
        spread:  { value: lvlVal.spread?.value ?? lvlVal.spread ?? 0, unit: "px" },
        opacity: lvlVal.opacity ?? 0.05
      }
    };
  }

  const borderStrat = shape.borderStrategy || "hairline";
  const bw = borderStrat === "none" ? 0 : (borderStrat === "bold" ? Math.max(2, shape.borderWidth ?? 2) : 1);

  Object.assign(dtcg.appearance, {
    elevation: {
      $description: "參數化深度系統。修改 strategy／intensity／tintColor 三者即可改變視覺風格，不需要寫死 levels 結構。",
      strategy: {
        $type: "string",
        $value: elev.strategy || "glass",
        $comment: "可選：material（緊湊不透明陰影）、glass（大擴散低不透明度＋邊框，可選 backdrop-blur）、flat（無陰影，靠底色分層）、glow（發光邊框與擴散，深色科技風）"
      },
      intensity: {
        $type: "number",
        $value: elev.intensity ?? 0.35,
        $comment: "設計深度強度係數 0~1，用來未來自適應調整 opacity 等級"
      },
      tintColor: {
        $type: "color",
        $value: elev.tintColor || (elev.strategy === "material" ? "#000000" : "{color.primary.900}"),
        $comment: "陰影色調。material 風建議用 #000000；glass／彌散風格建議用 primary 深色調而不純黑，避免髒髒的"
      },
      requiresBorder: {
        $type: "boolean",
        $value: elev.requiresBorder ?? (elev.strategy === "glass" || elev.strategy === "flat"),
        $comment: "glass 策略下通常搭配 1px 半透明邊緣，否則卡片會和背景糊在一起"
      },
      borderOpacity: {
        $type: "number",
        $value: elev.borderOpacity ?? 0.08
      },
      supportsBackdropBlur: {
        $type: "boolean",
        $value: elev.supportsBackdropBlur ?? (elev.strategy === "glass")
      },
      backdropBlur: {
        $type: "dimension",
        $value: { value: elev.backdropBlur ?? 20, unit: "px" }
      },
      levels: {
        $type: "shadow",
        ...elevLevelsObj
      }
    },
    shape: {
      $description: "形狀語言旋鈕。與 appearance.radius 搭配，決定圓角在不同元件層級如何套用。",
      cornerStrategy: {
        $type: "string",
        $value: cornerStrat,
        $comment: "可選：rounded-consistent（所有層級用等同圓角邏輯等比放大）、rounded-mixed（大容器圓、小元件較方，製造層次）、sharp（銳角直角，前衛藝術或工業調性）"
      },
      borderStrategy: {
        $type: "string",
        $value: borderStrat,
        $comment: "可選：none、hairline (0.5~1px 細邊框)、bold（≥2px 強調邊界）"
      },
      borderWidth: {
        $type: "dimension",
        $value: { value: bw, unit: "px" }
      },
      subcardBorderWidth: {
        $type: "dimension",
        $value: { value: state.shape?.subcardBorderWidth ?? 1, unit: "px" }
      }
    },
    component: {
      button: {
        radius: { $type: "dimension", $value: { value: state.components?.button?.radius ?? 8, unit: "px" } }
      },
      input: {
        radius: { $type: "dimension", $value: { value: state.components?.input?.radius ?? 8, unit: "px" } }
      },
      card: {
        padding: { $type: "dimension", $value: { value: state.components?.card?.padding ?? 24, unit: "px" } },
        radius: { $type: "dimension", $value: { value: state.components?.card?.radius ?? 16, unit: "px" } },
        elevation: { $type: "string", $value: state.components?.card?.elevation ? state.components.card.elevation.replace("{elevation.", "{appearance.elevation.") : "{appearance.elevation.levels.level-1}" }
      },
      subcard: {
        padding: { $type: "dimension", $value: { value: state.components?.subcard?.padding ?? 16, unit: "px" } },
        radius: { $type: "dimension", $value: { value: state.components?.subcard?.radius ?? 12, unit: "px" } }
      },
      checkboxRadio: {
        radius: { $type: "dimension", $value: { value: state.components?.checkboxRadio?.radius ?? 4, unit: "px" } }
      },
      slider: {
        radius: { $type: "dimension", $value: { value: state.components?.checkboxRadio?.radius ?? 4, unit: "px" } }
      }
    }
  });

  return dtcg;
}
