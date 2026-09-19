/* 預覽卡片：色彩組合展示 (Color Combos) */
export function createColorCombosCard() {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-combos';
  card.id = 'card-color-combos';
  
  card.innerHTML = `
    <div class="preview-card-body combos-container" style="display:flex; flex-direction:row; width:100%; height:100%; gap:12px; align-items:stretch; padding: 0;">
    </div>
  `;

  function update(state) {
    const container = card.querySelector('.combos-container');
    container.innerHTML = '';
    
    const mode = state.meta?.previewMode || "light";
    const currentColors = state.colors?.[mode] || state.colors?.light;
    const primaries = currentColors?.primaries || [];
    if (primaries.length === 0) return;

    const neutralId = currentColors?.neutral?.id || 'neutral';

    /* 輔助函式：建立獨立色塊 */
    function createBlock(bgId, textId) {
      const block = document.createElement('div');
      block.style.flex = '1';
      block.style.display = 'flex';
      block.style.alignItems = 'center';
      block.style.justifyContent = 'center';
      block.style.borderRadius = 'var(--ds-subcard-radius, var(--ds-radius-md, 8px))';
      block.style.backgroundColor = `var(--ds-color-${bgId}-500)`;
      block.style.color = `var(--ds-color-${textId}-500)`;
      block.style.fontFamily = 'var(--ds-font-headline)';
      block.style.fontSize = 'var(--ds-fs-headline-md, 24px)';
      block.style.lineHeight = 'var(--ds-lh-headline-md, 1.4)';
      block.style.fontWeight = '600';
      block.style.border = 'var(--ds-subcard-border-width, 1px) solid var(--ds-surface-border, #e2e5ea)';
      block.style.boxSizing = 'border-box';
      block.style.padding = '6px 12px';
      block.style.textAlign = 'center';
      
      const isZh = state.meta?.locale === 'zh-TW';
      block.innerHTML = `<span class="lang-zh" style="text-align:center;">${isZh ? '範例文字' : 'Example Text'}</span><span class="lang-en" style="text-align:center;">${!isZh ? 'Example Text' : ''}</span>`;
      return block;
    }

    /* 依照背景主色分組產生色塊組合 */
    for (let i = 0; i < primaries.length; i++) {
      /* 1. 主色與其他主色的組合 */
      if (primaries.length > 1) {
        for (let j = 0; j < primaries.length; j++) {
          if (i !== j) {
            container.appendChild(createBlock(primaries[i].id, primaries[j].id));
          }
        }
      }
      /* 2. 主色與中性色的組合（放置於該主色組合的最後） */
      container.appendChild(createBlock(primaries[i].id, neutralId));
    }
  }

  return { card, update };
}
