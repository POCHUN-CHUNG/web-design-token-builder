/* 預覽卡片：彈出對話框（展示毛玻璃背景與對話框樣式） */
export function createDialogCard() {
  const card = document.createElement("div");
  card.className = "preview-card card-col-dialog";
  card.id = "card-dialog";

  card.innerHTML = `
    <div class="dialog-preview-wrapper">
      <div class="dialog-preview-bg">
        <div class="dialog-bg-shape shape-1"></div>
        <div class="dialog-bg-shape shape-2"></div>
        <div class="dialog-bg-shape shape-3"></div>
      </div>
      <div class="dialog-backdrop-overlay"></div>
      <div class="dialog-modal-card">
        <div class="dialog-modal-header">
          <div class="dialog-modal-title">
            <span class="lang-zh">確認刪除項目？</span>
          </div>
          <button type="button" class="dialog-modal-close" aria-label="Close">✕</button>
        </div>
        <div class="dialog-modal-body">
          <span class="lang-zh">此操作將永久移除所選內容，無法復原。是否確定繼續？</span>
        </div>
        <div class="dialog-modal-actions" style="justify-content: space-between;">
          <button type="button" class="ds-btn ds-btn-outlined ds-btn-md" style="flex: 1;">
            <span class="lang-zh">取消</span>
          </button>
          <button type="button" class="ds-btn ds-btn-filled ds-btn-md" style="flex: 1; background-color: var(--ds-color-error-500, #ef4444); border-color: var(--ds-color-error-500, #ef4444); color: #fff;">
            <span class="lang-zh">確認</span>
          </button>
        </div>
      </div>
    </div>
  `;

  return card;
}
