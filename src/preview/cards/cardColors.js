/* 預覽卡片 1：色彩區塊（單列置中排列，寬度填滿，高度自適應填滿） */
import { hexToOklch } from "../../color/convert.js";
import { buildRamp } from "../../color/ramp.js";

export function createColorsCard(store) {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-colors';
  card.id = 'card-colors';

  card.innerHTML = `
    <div class="preview-card-body color-ramps-container-wrapper" style="display:flex; flex-direction:row; justify-content:center; align-items:stretch; flex: 1; min-height: 0; width:100%; overflow-x:auto; padding:0;">
      <div class="color-ramps-layout" id="colors-ramp-container" style="display:flex; flex-direction:row; justify-content:center; align-items:stretch; flex: 1; min-height: 0; width:100%; gap:8px;"></div>
    </div>
  `;

  const brandContainer = card.querySelector('#colors-ramp-container');

  function renderRampCard(nameZh, nameEn, seedHex, cssPrefix, isNeutral = false) {
    const rampCard = document.createElement('div');
    rampCard.className = 'ramp-card';
    rampCard.style.flex = '1 1 0';
    rampCard.style.height = '100%';
    rampCard.style.minHeight = '0';
    rampCard.style.display = 'flex';
    rampCard.style.flexDirection = 'column';
    rampCard.style.borderRadius = 'var(--ds-subcard-radius, var(--ds-radius-md, 8px))';
    rampCard.style.overflow = 'hidden';
    rampCard.style.border = 'var(--ds-subcard-border-width, 1px) solid var(--ds-surface-border, #e2e5ea)';
    rampCard.style.boxSizing = 'border-box';

    /* Top half (label-md) */
    const topHalf = document.createElement('div');
    topHalf.className = 'ramp-top-half';
    topHalf.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-500, ${seedHex})` : seedHex;
    topHalf.style.display = 'flex';
    topHalf.style.flexDirection = 'column';
    topHalf.style.justifyContent = 'flex-end';
    topHalf.style.alignItems = 'flex-end';
    topHalf.style.padding = '8px 8px 4px 8px';
    topHalf.style.fontFamily = 'var(--ds-font-label)';
    topHalf.style.fontSize = 'var(--ds-fs-label-md, 13px)';
    topHalf.style.height = '60%';
    topHalf.style.minHeight = '0';
    topHalf.style.flex = 'none';
    topHalf.style.boxSizing = 'border-box';
    topHalf.style.overflow = 'hidden';

    if (cssPrefix) {
      const onPrefix = cssPrefix.replace('ds-color-', 'ds-color-on-');
      topHalf.style.color = `var(--${onPrefix})`;
    } else {
      const { L } = hexToOklch(seedHex);
      topHalf.style.color = L > 0.65 ? '#000000' : '#ffffff';
    }

    const label = document.createElement('div');
    label.className = 'ramp-name';
    label.style.fontFamily = 'var(--ds-font-label)';
    label.style.fontSize = 'var(--ds-fs-label-md, 13px)';
    label.style.fontWeight = '600';
    label.innerHTML = `<span class="lang-zh">${nameZh}</span><span class="lang-sep"> / </span><span class="lang-en">${nameEn}</span>`;

    const hexLabel = document.createElement('div');
    hexLabel.className = 'ramp-hex';
    hexLabel.style.fontFamily = 'var(--ds-font-label)';
    hexLabel.style.fontSize = 'var(--ds-fs-label-md, 13px)';
    hexLabel.style.fontWeight = '500';
    hexLabel.textContent = seedHex.toUpperCase();
    hexLabel.style.textAlign = 'right';

    topHalf.appendChild(label);
    topHalf.appendChild(hexLabel);

    /* Bottom half (11 swatches across width) */
    const bottomHalf = document.createElement('div');
    bottomHalf.className = 'ramp-bottom-half';
    bottomHalf.style.display = 'flex';
    bottomHalf.style.width = '100%';
    bottomHalf.style.borderTop = 'none';
    bottomHalf.style.height = '40%';
    bottomHalf.style.minHeight = '0';
    bottomHalf.style.flex = 'none';
    bottomHalf.style.boxSizing = 'border-box';

    const ramp = buildRamp(seedHex, isNeutral);
    const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    steps.forEach((step, idx) => {
      const swatch = document.createElement('div');
      swatch.className = 'ramp-swatch';
      swatch.style.flex = '1';
      swatch.style.height = '100%';
      swatch.style.minWidth = '0';
      swatch.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-${step}, ${ramp[idx]})` : ramp[idx];
      swatch.title = `${nameEn} ${step}`;
      bottomHalf.appendChild(swatch);
    });

    rampCard.appendChild(topHalf);
    rampCard.appendChild(bottomHalf);

    return rampCard;
  }

  function updateRampCard(rampCard, nameZh, nameEn, seedHex, cssPrefix, isNeutral = false) {
    const topHalf = rampCard.querySelector('.ramp-top-half');
    if (topHalf) {
      topHalf.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-500, ${seedHex})` : seedHex;
      if (cssPrefix) {
        const onPrefix = cssPrefix.replace('ds-color-', 'ds-color-on-');
        topHalf.style.color = `var(--${onPrefix})`;
      } else {
        const { L } = hexToOklch(seedHex);
        topHalf.style.color = L > 0.65 ? '#000000' : '#ffffff';
      }

      const label = topHalf.querySelector('.ramp-name');
      if (label) {
        label.innerHTML = `<span class="lang-zh">${nameZh}</span><span class="lang-sep"> / </span><span class="lang-en">${nameEn}</span>`;
      }

      const hexLabel = topHalf.querySelector('.ramp-hex');
      if (hexLabel) hexLabel.textContent = seedHex.toUpperCase();
    }

    const swatches = rampCard.querySelectorAll('.ramp-swatch');
    if (swatches && swatches.length === 11) {
      const ramp = buildRamp(seedHex, isNeutral);
      const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
      swatches.forEach((swatch, idx) => {
        swatch.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-${steps[idx]}, ${ramp[idx]})` : ramp[idx];
      });
    }
  }

  function update(state) {
    if (!state || !state.colors) return;
    const mode = state.meta.previewMode || "light";
    const currentColors = state.colors[mode] || state.colors.light;
    const colorList = [];

    /* 1. 主要色 (Primary) */
    const PRIMARY_ZH = ["主要 1", "主要 2", "主要 3"];
    const PRIMARY_EN = ["Primary 1", "Primary 2", "Primary 3"];
    if (currentColors.primaries) {
      currentColors.primaries.forEach((c, idx) => {
        const titleZh = PRIMARY_ZH[idx] || `主要 ${idx + 1}`;
        const titleEn = PRIMARY_EN[idx] || `Primary ${idx + 1}`;
        const prefix = `ds-color-${c.id || (idx === 0 ? "primary" : idx === 1 ? "secondary" : "tertiary")}`;
        colorList.push({ nameZh: titleZh, nameEn: titleEn, seed: c.seed, prefix, isNeutral: false });
      });
    }

    /* 2. 輔助色 (Accent) */
    if (currentColors.accents) {
      currentColors.accents.forEach((c, idx) => {
        const titleZh = `輔助 ${idx + 1}`;
        const titleEn = `Accent ${idx + 1}`;
        const prefix = `ds-color-${c.id || `accent-${idx + 1}`}`;
        colorList.push({ nameZh: titleZh, nameEn: titleEn, seed: c.seed, prefix, isNeutral: false });
      });
    }

    /* 3. 中性色 (Neutral) */
    if (currentColors.neutral) {
      colorList.push({
        nameZh: "中性",
        nameEn: "Neutral",
        seed: currentColors.neutral.seed,
        prefix: "ds-color-neutral",
        isNeutral: true
      });
    }

    /* 4. 連結色 (Link) */
    const linkSeed = currentColors.link?.seed || currentColors.primaries?.[0]?.seed || "#7F5539";
    colorList.push({
      nameZh: "連結",
      nameEn: "Link",
      seed: linkSeed,
      prefix: "ds-color-link",
      isNeutral: false
    });

    /* 5. 狀態色 (成功、警告、錯誤、資訊) */
    const semMap = currentColors.semantic || {};
    const STATUS_ITEMS = [
      { key: "success", nameZh: "成功", nameEn: "Success", defaultHex: "#15803d" },
      { key: "warning", nameZh: "警告", nameEn: "Warning", defaultHex: "#b45309" },
      { key: "error",   nameZh: "錯誤", nameEn: "ERROR",   defaultHex: "#c22020" },
      { key: "info",    nameZh: "資訊", nameEn: "Info",    defaultHex: "#0369a1" }
    ];
    STATUS_ITEMS.forEach(item => {
      colorList.push({
        nameZh: item.nameZh,
        nameEn: item.nameEn,
        seed: semMap[item.key] || item.defaultHex,
        prefix: `ds-color-semantic-${item.key}`,
        isNeutral: false
      });
    });

    if (brandContainer) {
      if (brandContainer.children.length === colorList.length) {
        colorList.forEach((item, idx) => {
          updateRampCard(brandContainer.children[idx], item.nameZh, item.nameEn, item.seed, item.prefix, item.isNeutral);
        });
      } else {
        brandContainer.innerHTML = '';
        colorList.forEach(item => {
          brandContainer.appendChild(renderRampCard(item.nameZh, item.nameEn, item.seed, item.prefix, item.isNeutral));
        });
      }
    }
  }

  if (store) {
    update(store.getState());
  }

  return { card, update };
}
