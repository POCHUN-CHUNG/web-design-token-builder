export function createButtonsCard(store) {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-buttons';
  card.id = 'card-buttons';

  card.innerHTML = `
    <div class="preview-card-body buttons-matrix">
      <!-- 1. Primary Style -->
      <div class="button-style-group" id="btn-group-primary">
        <span class="button-group-title"><span class="lang-zh">主要</span><span class="lang-sep"> / </span><span class="lang-en">Primary</span></span>
        <div class="button-row-states" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="ds-btn ds-btn-primary ds-btn-md"><span class="lang-zh">一般</span><span class="lang-sep"> / </span><span class="lang-en">Rest</span></button>
          <button class="ds-btn ds-btn-primary ds-btn-md is-hover"><span class="lang-zh">懸停</span><span class="lang-sep"> / </span><span class="lang-en">Hover</span></button>
          <button class="ds-btn ds-btn-primary ds-btn-md is-focus"><span class="lang-zh">聚焦</span><span class="lang-sep"> / </span><span class="lang-en">Focus</span></button>
          <button class="ds-btn ds-btn-primary ds-btn-md is-disabled" disabled><span class="lang-zh">停用</span><span class="lang-sep"> / </span><span class="lang-en">Disabled</span></button>
        </div>
      </div>

      <!-- 2. Secondary Style -->
      <div class="button-style-group" id="btn-group-secondary">
        <span class="button-group-title"><span class="lang-zh">次要</span><span class="lang-sep"> / </span><span class="lang-en">Secondary</span></span>
        <div class="button-row-states" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="ds-btn ds-btn-secondary ds-btn-md"><span class="lang-zh">一般</span><span class="lang-sep"> / </span><span class="lang-en">Rest</span></button>
          <button class="ds-btn ds-btn-secondary ds-btn-md is-hover"><span class="lang-zh">懸停</span><span class="lang-sep"> / </span><span class="lang-en">Hover</span></button>
          <button class="ds-btn ds-btn-secondary ds-btn-md is-focus"><span class="lang-zh">聚焦</span><span class="lang-sep"> / </span><span class="lang-en">Focus</span></button>
          <button class="ds-btn ds-btn-secondary ds-btn-md is-disabled" disabled><span class="lang-zh">停用</span><span class="lang-sep"> / </span><span class="lang-en">Disabled</span></button>
        </div>
      </div>

      <!-- 3. Inverted Style -->
      <div class="button-style-group" id="btn-group-inverted">
        <span class="button-group-title"><span class="lang-zh">反轉</span><span class="lang-sep"> / </span><span class="lang-en">Inverted</span></span>
        <div class="button-row-states" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="ds-btn ds-btn-inverted ds-btn-md"><span class="lang-zh">一般</span><span class="lang-sep"> / </span><span class="lang-en">Rest</span></button>
          <button class="ds-btn ds-btn-inverted ds-btn-md is-hover"><span class="lang-zh">懸停</span><span class="lang-sep"> / </span><span class="lang-en">Hover</span></button>
          <button class="ds-btn ds-btn-inverted ds-btn-md is-focus"><span class="lang-zh">聚焦</span><span class="lang-sep"> / </span><span class="lang-en">Focus</span></button>
          <button class="ds-btn ds-btn-inverted ds-btn-md is-disabled" disabled><span class="lang-zh">停用</span><span class="lang-sep"> / </span><span class="lang-en">Disabled</span></button>
        </div>
      </div>

      <!-- 4. Outlined Style -->
      <div class="button-style-group" id="btn-group-outlined">
        <span class="button-group-title"><span class="lang-zh">邊框</span><span class="lang-sep"> / </span><span class="lang-en">Outlined</span></span>
        <div class="button-row-states" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="ds-btn ds-btn-outlined ds-btn-md"><span class="lang-zh">一般</span><span class="lang-sep"> / </span><span class="lang-en">Rest</span></button>
          <button class="ds-btn ds-btn-outlined ds-btn-md is-hover"><span class="lang-zh">懸停</span><span class="lang-sep"> / </span><span class="lang-en">Hover</span></button>
          <button class="ds-btn ds-btn-outlined ds-btn-md is-focus"><span class="lang-zh">聚焦</span><span class="lang-sep"> / </span><span class="lang-en">Focus</span></button>
          <button class="ds-btn ds-btn-outlined ds-btn-md is-disabled" disabled><span class="lang-zh">停用</span><span class="lang-sep"> / </span><span class="lang-en">Disabled</span></button>
        </div>
      </div>
      
      <!-- 5. Ghost Style -->
      <div class="button-style-group" id="btn-group-ghost">
        <span class="button-group-title"><span class="lang-zh">幽靈</span><span class="lang-sep"> / </span><span class="lang-en">Ghost</span></span>
        <div class="button-row-states" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;">
          <button class="ds-btn ds-btn-ghost ds-btn-md"><span class="lang-zh">一般</span><span class="lang-sep"> / </span><span class="lang-en">Rest</span></button>
          <button class="ds-btn ds-btn-ghost ds-btn-md is-hover"><span class="lang-zh">懸停</span><span class="lang-sep"> / </span><span class="lang-en">Hover</span></button>
          <button class="ds-btn ds-btn-ghost ds-btn-md is-focus"><span class="lang-zh">聚焦</span><span class="lang-sep"> / </span><span class="lang-en">Focus</span></button>
          <button class="ds-btn ds-btn-ghost ds-btn-md is-disabled" disabled><span class="lang-zh">停用</span><span class="lang-sep"> / </span><span class="lang-en">Disabled</span></button>
        </div>
      </div>

      <!-- 6. 尺寸展示：6 個按鈕平均分散 -->
      <div class="button-style-group" id="btn-group-sizes" style="width: 100%;">
        <span class="button-group-title"><span class="lang-zh">尺寸</span><span class="lang-sep"> / </span><span class="lang-en">Sizes</span></span>
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; width: 100%;">
          <!-- icon 小 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width: 28px; height: 28px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: calc(var(--ds-btn-radius) * 0.8);" title="小圖示按鈕">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <!-- icon 中 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width: 36px; height: 36px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--ds-btn-radius);" title="中圖示按鈕">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <!-- icon 大 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width: 44px; height: 44px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: calc(var(--ds-btn-radius) * 1.2);" title="大圖示按鈕">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
          <!-- 文字 小 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width:auto; padding: calc(var(--ds-btn-padding-y) * 0.75) calc(var(--ds-btn-padding-x) * 0.85); font-size: calc(var(--ds-btn-font-size) * 0.85); border-radius: calc(var(--ds-btn-radius) * 0.85);">
            <span class="lang-zh">小尺寸</span><span class="lang-sep"> / </span><span class="lang-en">Small</span>
          </button>
          <!-- 文字 中 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width:auto; padding: var(--ds-btn-padding-y) var(--ds-btn-padding-x);">
            <span class="lang-zh">中尺寸</span><span class="lang-sep"> / </span><span class="lang-en">Medium</span>
          </button>
          <!-- 文字 大 -->
          <button class="ds-btn ds-btn-primary" style="flex-shrink:0; width:auto; padding: calc(var(--ds-btn-padding-y) * 1.25) calc(var(--ds-btn-padding-x) * 1.2); font-size: calc(var(--ds-btn-font-size) * 1.15); border-radius: calc(var(--ds-btn-radius) * 1.15);">
            <span class="lang-zh">大尺寸</span><span class="lang-sep"> / </span><span class="lang-en">Large</span>
          </button>
        </div>
      </div>
    </div>
  `;

  function update(state) {}

  if (store) {
    update(store.getState());
  }

  return { card, update };
}