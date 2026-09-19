/* 預覽卡片：狀態顏色 (獨立主區塊，無標題，包含成功、警告、刪除、資訊 4 色色階) */
import { hexToOklch } from "../../color/convert.js";
import { buildRamp } from "../../color/ramp.js";

export function createStatusColorsCard(store) {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-status-colors';
  card.id = 'card-status-colors';

  card.innerHTML = `
    <div class="preview-card-body" style="display:flex; flex-direction:column; height:100%; overflow:hidden; padding:0;">
      <!-- 中性色、超連結與狀態顏色展示區域 (填滿高度，自適應高度) -->
      <div class="status-ramps-layout" id="status-ramps-container" style="display:flex; flex-direction:column; height:100%; gap:8px; flex:1;"></div>
    </div>
  `;

  const statusContainer = card.querySelector('#status-ramps-container');

  function renderRampCard(nameZh, nameEn, seedHex, cssPrefix = '', isNeutral = false) {
    const rampCard = document.createElement('div');
    rampCard.className = 'ramp-card';
    rampCard.style.flex = '1';
    rampCard.style.display = 'flex';
    rampCard.style.flexDirection = 'column';

    /* Top half (body-md, min-height: 80px) */
    const topHalf = document.createElement('div');
    topHalf.className = 'ramp-top-half';
    topHalf.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-500, ${seedHex})` : seedHex;
    topHalf.style.display = 'flex';
    topHalf.style.justifyContent = 'space-between';
    topHalf.style.alignItems = 'flex-end';
    topHalf.style.padding = '8px 12px';
    topHalf.style.minHeight = '80px';
    topHalf.style.fontFamily = 'var(--ds-font-label)';
    topHalf.style.fontSize = 'var(--ds-fs-label-md, 13px)';
    topHalf.style.flex = '1';

    const { L } = hexToOklch(seedHex);
    topHalf.style.color = L > 0.65 ? '#000000' : '#ffffff';

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

    /* Bottom half (11 swatches, min-height: 50px, width: 100%) */
    const bottomHalf = document.createElement('div');
    bottomHalf.className = 'ramp-bottom-half';
    bottomHalf.style.display = 'flex';
    bottomHalf.style.width = '100%';
    bottomHalf.style.height = '50px';
    bottomHalf.style.minHeight = '50px';
    bottomHalf.style.borderTop = 'none';
    bottomHalf.style.flexShrink = '0';

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

  function updateRampCard(rampCard, nameZh, nameEn, seedHex, cssPrefix = '', isNeutral = false) {
    const topHalf = rampCard.querySelector('.ramp-top-half');
    if (topHalf) {
      topHalf.style.backgroundColor = cssPrefix ? `var(--${cssPrefix}-500, ${seedHex})` : seedHex;
      const { L } = hexToOklch(seedHex);
      topHalf.style.color = L > 0.65 ? '#000000' : '#ffffff';

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

  const STATUS_ITEMS = [
    { key: "success", nameZh: "成功", nameEn: "Success", defaultHex: "#15803d" },
    { key: "warning", nameZh: "警告", nameEn: "Warning", defaultHex: "#b45309" },
    { key: "error",   nameZh: "錯誤", nameEn: "ERROR",  defaultHex: "#b91c1c" },
    { key: "info",    nameZh: "資訊", nameEn: "Info",    defaultHex: "#0369a1" }
  ];

  function update(state) {
    if (!state || !state.colors) return;
    const { colors } = state;
    const semMap = colors.semantic || {};

    const list = [];

    /* 1. 中性色 (最上方) */
    if (colors.neutral) {
      list.push({
        nameZh: "中性",
        nameEn: "Neutral",
        seed: colors.neutral.seed,
        prefix: "ds-color-neutral",
        isNeutral: true
      });
    }

    /* 2. 超連結色 (中性色下方) */
    const linkSeed = colors.link?.seed || colors.primaries?.[0]?.seed || "#7F5539";
    list.push({
      nameZh: "連結",
      nameEn: "Link",
      seed: linkSeed,
      prefix: "ds-color-link",
      isNeutral: false
    });

    /* 3. 狀態顏色 (成功、警告、刪除、資訊) */
    STATUS_ITEMS.forEach(item => {
      list.push({
        nameZh: item.nameZh,
        nameEn: item.nameEn,
        seed: semMap[item.key] || item.defaultHex,
        prefix: `ds-color-semantic-${item.key}`,
        isNeutral: false
      });
    });

    if (statusContainer) {
      if (statusContainer.children.length === list.length) {
        list.forEach((item, idx) => {
          updateRampCard(statusContainer.children[idx], item.nameZh, item.nameEn, item.seed, item.prefix, item.isNeutral);
        });
      } else {
        statusContainer.innerHTML = '';
        list.forEach(item => {
          statusContainer.appendChild(renderRampCard(item.nameZh, item.nameEn, item.seed, item.prefix, item.isNeutral));
        });
      }
    }
  }

  if (store) {
    update(store.getState());
  }

  return { card, update };
}
