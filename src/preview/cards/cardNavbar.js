/* 導覽列樣式展示模組 (Dock Showcase，對齊附圖 media_1789440967181) */
export function createNavbarShowcase(store) {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-dock';
  card.id = 'card-dock';

  card.innerHTML = `
    <div class="preview-card-body" style="display:flex; align-items:center; justify-content:center; padding: 20px 0; background: var(--ds-surface-text, #16181d); border-radius: var(--ds-radius-lg, 12px);">
      <div class="dock-container" style="display: flex; align-items: center; gap: 32px; padding: 12px 32px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; backdrop-filter: blur(12px);">
        <div class="dock-item" style="width: 44px; height: 44px; border-radius: 50%; background: var(--ds-color-primary-500, #3b82f6); display: flex; align-items: center; justify-content: center; cursor: pointer; color: white;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        </div>
        <div class="dock-item" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255, 255, 255, 0.7);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <div class="dock-item" style="width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255, 255, 255, 0.7);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
      </div>
    </div>
  `;

  function update(state) {
    /* Dock 樣式自動套用 token */
  }

  if (store) {
    update(store.getState());
  }

  return { card, update };
}
