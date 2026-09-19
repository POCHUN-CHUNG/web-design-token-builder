import { t } from "../i18n/index.js";

function label(key, fallback = "") {
  const str = t(key) || fallback;
  return str.replace(/\s*[（\(].*?[）\)]/g, "").trim();
}

export function stateToText(state) {
  let lines = [];
  lines.push("========================================");
  lines.push(`        ${label("topbar.title")}       `);
  lines.push("========================================");
  lines.push("");

  // Colors
  lines.push(`=== ${label("panel.colors.title")} ===`);
  ["light", "dark"].forEach(mode => {
    lines.push(`\n[${mode === "light" ? label("colors.surfaceOverride.light") : label("colors.surfaceOverride.dark")}]`);
    const c = state.colors[mode];
    if (!c) return;

    if (c.surface) {
      lines.push(`  ${label("colors.surfaceOverride")}:`);
      lines.push(`    - ${label("colors.surface.bg")}: ${c.surface.bg}`);
      lines.push(`    - ${label("colors.surface.btnInvertedBg")}: ${c.surface.btnInvertedBg}`);
      lines.push(`    - ${label("colors.surface.surface")}: ${c.surface.surface}`);
      lines.push(`    - ${label("colors.surface.surfaceRaised")}: ${c.surface.surfaceRaised}`);
      lines.push(`    - ${label("colors.surface.btnSecondaryBg")}: ${c.surface.btnSecondaryBg}`);
      lines.push(`    - ${label("colors.surface.text")}: ${c.surface.text}`);
      lines.push(`    - ${label("colors.surface.textInverted")}: ${c.surface.textInverted}`);
      lines.push(`    - ${label("colors.surface.border")}: ${c.surface.border}`);
    }

    if (c.primaries) {
      lines.push(`  ${label("colors.primaries")}:`);
      c.primaries.forEach((p, i) => {
        lines.push(`    - ${label("colors.primaries")} ${i+1}: ${p.seed}`);
      });
    }

    if (c.neutral) {
      lines.push(`  ${label("colors.neutral")}: ${c.neutral.seed}`);
    }
    
    if (c.link) {
      lines.push(`  ${label("colors.link")}: ${c.link.seed}`);
    }

    if (c.accents) {
      lines.push(`  ${label("colors.accents")}:`);
      c.accents.forEach((a, i) => {
        lines.push(`    - ${label("colors.accents")} ${i+1}: ${a.seed}`);
      });
    }

    if (c.semantic) {
      lines.push(`  ${label("colors.semantic")}:`);
      for (const [k, v] of Object.entries(c.semantic)) {
        lines.push(`    - ${label("colors.semantic." + k, k)}: ${v}`);
      }
    }
  });

  lines.push("");
  lines.push(`=== ${label("panel.typography.title")} ===`);
  const typo = state.typography;
  if (typo) {
    lines.push(`- ${label("typography.bodyFont")}: ${typo.families?.body}`);
    lines.push(`- ${label("typography.headingFont")}: ${typo.families?.heading}`);
    lines.push(`- ${label("typography.cjkFont")}: ${typo.families?.cjk}`);
    
    const scaleVal = typeof typo.scale === "object" ? typo.scale.ratio : typo.scale;
    lines.push(`- ${label("typography.ratio")}: ${scaleVal}`);
  }

  lines.push("");
  lines.push(`=== ${label("panel.elevation.title")} ===`);
  
  const elev = state.elevation;
  if (elev) {
    lines.push(`- ${label("elevation.strategy")}: ${label("elevation.strategy." + elev.strategy, elev.strategy)}`);
    lines.push(`- ${label("elevation.intensity")}: ${elev.intensity}`);
    lines.push(`- ${label("elevation.tintColor")}: ${label("elevation.tintColor." + elev.tintColorMode, elev.tintColor)}`);
  }

  const shape = state.shape;
  if (shape) {
    lines.push(`- ${label("shape.borderWidth")} - ${label("components.card", "Card")}: ${shape.borderWidth}px`);
    lines.push(`- ${label("shape.borderWidth")} - ${label("components.subcard", "Subcard")}: ${shape.subcardBorderWidth}px`);
  }
  
  const comp = state.components;
  if (comp) {
    lines.push(`\n  ${label("components.radiusHierarchy", "圓角")}:`);
    lines.push(`    - ${label("components.card", "卡片")}: ${comp.card?.radius}px`);
    lines.push(`    - ${label("components.subcard", "子卡片")}: ${comp.subcard?.radius}px`);
    lines.push(`    - ${label("components.button", "按鈕")}: ${comp.button?.radius}px`);
    lines.push(`    - ${label("components.input", "輸入框")}: ${comp.input?.radius}px`);
    lines.push(`    - ${label("components.controls", "控制項")}: ${comp.checkboxRadio?.radius}px`);
    
    lines.push(`\n  ${label("components.paddingSection", "內距")}:`);
    lines.push(`    - ${label("components.cardPadding", "卡片")}: ${comp.card?.padding}px`);
    lines.push(`    - ${label("components.subcardPadding", "子卡片")}: ${comp.subcard?.padding}px`);
  }

  return lines.join("\n");
}
