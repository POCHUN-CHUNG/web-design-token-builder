/* 設定區塊共用基底模組（完全遵循 SPEC 第 9.3.1 與 9.3.2 節） */
import { setPanelOpen, setPanelCompleted } from "../core/actions.js";
import { t } from "../i18n/index.js";

export function createPanelBlock({ id, titleKey, store, renderContent, showAction = true }) {
  const block = document.createElement("div");
  block.className = "panel-block";
  block.id = `panel-${id}`;

  const header = document.createElement("div");
  header.className = "panel-header";

  const titleEl = document.createElement("span");
  titleEl.className = "panel-header-title";
  titleEl.textContent = t(titleKey);

  const rightEl = document.createElement("div");
  rightEl.className = "panel-header-right";

  let statusEl = null;
  let actionBtn = null;

  if (showAction) {
    /* 綠色完成狀態文字（位於按鈕外部左側, SPEC 9.3.1） */
    statusEl = document.createElement("span");
    statusEl.className = "panel-status-text";
    statusEl.textContent = t("status.completed");

    /* 動作按鈕（完成 / 編輯） */
    actionBtn = document.createElement("button");
    actionBtn.className = "panel-action-btn icon-btn";
    actionBtn.type = "button";
    actionBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    actionBtn.title = t("action.done");

    rightEl.appendChild(statusEl);
    rightEl.appendChild(actionBtn);
  }

  /* 收合圖示按鈕 */
  const collapseBtn = document.createElement("button");
  collapseBtn.className = "panel-collapse-btn";
  collapseBtn.type = "button";
  collapseBtn.innerHTML = `<svg class="chevron-icon" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  rightEl.appendChild(collapseBtn);

  header.appendChild(titleEl);
  header.appendChild(rightEl);

  const content = document.createElement("div");
  content.className = "panel-content";

  block.appendChild(header);
  block.appendChild(content);

  /* 點擊標題列切換開合 */
  header.addEventListener("click", (e) => {
    if (actionBtn && e.target.closest(".panel-action-btn")) return; /* 避免觸發動作按鈕 */
    const state = store.getState();
    const currentOpen = state.ui?.panels?.[id]?.open ?? false;
    store.dispatch(setPanelOpen(id, !currentOpen));
  });

  if (actionBtn) {
    /* 點擊動作按鈕（完成 / 編輯 狀態機轉換） */
    actionBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const state = store.getState();
      const currentCompleted = state.ui?.panels?.[id]?.completed ?? false;
      /* 點完成 -> completed=true (自動收合)；點編輯 -> completed=false (自動展開) */
      store.dispatch(setPanelCompleted(id, !currentCompleted));
    });
  }

  /* 呼叫內容渲染回呼 */
  renderContent(content, store);

  /* 監聽狀態變更以同步 UI */
  function update(state) {
    const panelState = state.ui?.panels?.[id] || { open: false, completed: false };

    if (panelState.open) {
      block.classList.add("open");
    } else {
      block.classList.remove("open");
    }

    if (actionBtn) {
      if (panelState.completed) {
        block.classList.add("completed");
        actionBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
        actionBtn.title = t("action.edit");
      } else {
        block.classList.remove("completed");
        actionBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        actionBtn.title = t("action.done");
      }
    }

    titleEl.textContent = t(titleKey);
    if (statusEl) statusEl.textContent = t("status.completed");
  }

  /* 初始化首次同步 */
  update(store.getState());

  return {
    block,
    update
  };
}
