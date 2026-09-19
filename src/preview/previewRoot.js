/* 預覽根容器與網格初始化模組 */
import { createColorsCard } from "./cards/cardColors.js";
import { createTypeCard } from "./cards/cardType.js";
import { createButtonsCard } from "./cards/cardButtons.js";
import { createFormsCard } from "./cards/cardForms.js";
import { createColorCombosCard } from "./cards/cardColorCombos.js";

export function initPreviewRoot(containerEl, store) {
  if (!containerEl) return null;

  /* 預覽 DOM 只在啟動時建立一次 (SPEC 3.2 Rule 1) */
  const wrapper = document.createElement("div");
  wrapper.className = "preview-container";

  const grid = document.createElement("div");
  grid.className = "preview-grid";

  /* 第一列：色彩區塊（全寬） */
  const colorsCard = createColorsCard(store);
  grid.appendChild(colorsCard.card || colorsCard);

  /* 第二列：色彩組合區塊（全寬） */
  const combosCard = createColorCombosCard();
  grid.appendChild(combosCard.card || combosCard);

  /* 第三列：字級區塊、按鈕區塊、表單區塊並排 */
  const row3Wrapper = document.createElement("div");
  row3Wrapper.className = "preview-row-3-wrapper";
  row3Wrapper.style.gridColumn = "1 / -1";
  row3Wrapper.style.display = "flex";
  row3Wrapper.style.gap = "var(--ds-gutter, 20px)";
  row3Wrapper.style.alignItems = "stretch";

  /* 字級卡片 */
  row3Wrapper.appendChild(createTypeCard());

  /* 按鈕卡片 */
  const buttonsCard = createButtonsCard(store);
  row3Wrapper.appendChild(buttonsCard.card || buttonsCard);

  /* 表單卡片 */
  const formsCard = createFormsCard();
  row3Wrapper.appendChild(formsCard.card || formsCard);

  grid.appendChild(row3Wrapper);

  wrapper.appendChild(grid);
  containerEl.appendChild(wrapper);

  function updateOverlay(state) {
    const cols = state?.layout?.gridColumns || 16;
    const gutter = state?.layout?.gutter ?? 20;

    grid.setAttribute("data-columns", String(cols));
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gap = `${gutter}px`;
  }

  updateOverlay(store ? store.getState() : {});

  return {
    wrapper,
    grid,
    update: (state) => {
      if (colorsCard.update) colorsCard.update(state);
      if (combosCard.update) combosCard.update(state);
      if (buttonsCard.update) buttonsCard.update(state);
      if (formsCard.update) formsCard.update(state);
      updateOverlay(state);
    }
  };
}

/* 載入轉圈控制器：延遲 120ms 顯示，若 120ms 內完成則完全不閃爍 (SPEC 3.2) */
export function createLoadingIndicator(loadingEl) {
  let timer = null;

  return {
    start() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (loadingEl) loadingEl.classList.add("show");
      }, 120);
    },
    end() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (loadingEl) loadingEl.classList.remove("show");
    }
  };
}

/* 全螢幕切換功能（原生 Fullscreen API ＋ CSS 降級備援，SPEC 9.6） */
export function toggleFullscreen(targetEl) {
  if (!document.fullscreenElement && !targetEl.classList.contains("is-fullscreen-fallback")) {
    if (targetEl.requestFullscreen) {
      targetEl.requestFullscreen().catch(() => {
        targetEl.classList.add("is-fullscreen-fallback");
      });
    } else {
      targetEl.classList.add("is-fullscreen-fallback");
    }
  } else {
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
        targetEl.classList.remove("is-fullscreen-fallback");
      });
    } else {
      targetEl.classList.remove("is-fullscreen-fallback");
    }
  }
}
