/* 系統主進入點（完全遵循 SPEC 第 3、4、9、13、14 節） */
import { createStore } from "./core/store.js";
import { reducer } from "./core/reducer.js";
import { defaultState } from "./core/defaultState.js";
import { setTab, setLocale, setPreviewMode, setLeftWidth, resetAll, hydrate, patch } from "./core/actions.js";
import { createRafBatcher, debounce, scheduleIdle } from "./core/schedule.js";
import { deriveTokens } from "./tokens/derive.js";
import { applyTokens } from "./tokens/apply.js";
import { initPreviewRoot, createLoadingIndicator, toggleFullscreen } from "./preview/previewRoot.js";
import { encodeState, decodeState } from "./url/codec.js";
import { t, setLocale as setI18nLocale } from "./i18n/index.js";
import { STORAGE_KEY, SCHEMA_VERSION } from "./config.js";
import { runA11yAudit, fixA11yIssues } from "./a11y/audit.js";

/* 各設定區塊元件 */
import { createColorsPanel } from "./panels/p2Colors.js";
import { createTypographyPanel } from "./panels/p3Typography.js";
import { createElevationShapePanel } from "./panels/p5ElevationShape.js";
import { stateToDtcg } from "./export/toDtcg.js";

async function init() {
  /* 1. 決定初始狀態優先序 (SPEC 13.2) */
  let initial = defaultState;

  /* 優先序 1: URL #c= */
  const hash = window.location.hash;
  if (hash.startsWith("#c=")) {
    const encoded = hash.slice(3);
    const decoded = await decodeState(encoded);
    if (decoded && decoded.meta?.schemaVersion === SCHEMA_VERSION) {
      initial = {
        ...defaultState,
        ...decoded,
        colors: {
          ...defaultState.colors,
          ...(decoded.colors || {}),
          light: {
            ...defaultState.colors.light,
            ...(decoded.colors?.light || {}),
            surface: {
              ...defaultState.colors.light.surface,
              ...(decoded.colors?.light?.surface || {})
            }
          },
          dark: {
            ...defaultState.colors.dark,
            ...(decoded.colors?.dark || {}),
            surface: {
              ...defaultState.colors.dark.surface,
              ...(decoded.colors?.dark?.surface || {})
            }
          }
        },
        ui: { ...defaultState.ui }
      };
      /* 清除 hash */
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  } else {
    /* 優先序 2: localStorage */
    try {
      /* 清除舊版本 localStorage 快取，防止舊版 2 個輔助色或舊調色覆寫新設定 */
      ["byds:state:v1", "byds:state:v2", "byds:state:v3", "byds:state:v4", "byds:state:v5"].forEach(k => {
        try { localStorage.removeItem(k); } catch (_) {}
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.meta?.schemaVersion === SCHEMA_VERSION) {
          initial = {
            ...defaultState,
            ...parsed,
            colors: {
              ...defaultState.colors,
              ...(parsed.colors || {}),
              light: {
                ...defaultState.colors.light,
                ...(parsed.colors?.light || {}),
                surface: {
                  ...defaultState.colors.light.surface,
                  ...(parsed.colors?.light?.surface || {})
                }
              },
              dark: {
                ...defaultState.colors.dark,
                ...(parsed.colors?.dark || {}),
                surface: {
                  ...defaultState.colors.dark.surface,
                  ...(parsed.colors?.dark?.surface || {})
                }
              },
              link: parsed.colors?.link || defaultState.colors.link,
              accents: (Array.isArray(parsed.colors?.accents) && parsed.colors.accents.length >= 6)
                ? parsed.colors.accents
                : defaultState.colors.accents
            },
            typography: {
              ...defaultState.typography,
              ...(parsed.typography || {}),
              families: {
                ...defaultState.typography.families,
                ...(parsed.typography?.families || {})
              }
            },
            ui: {
              ...defaultState.ui,
              ...(parsed.ui || {}),
              leftPanelWidth: 200, /* 強制覆寫為 200px */
              panels: {
                ...defaultState.ui.panels,
                ...(parsed.ui?.panels || {})
              }
            }
          };
        }
      }
    } catch (e) {
      console.warn("localStorage read failed, using defaultState", e);
    }
  }

  /* 決定預覽主題模式：使用者最後手動切換的模式優先，否則依據使用者作業系統/瀏覽器的顯示模式 */
  const THEME_STORAGE_KEY = "byds:theme_mode";
  const savedThemeMode = localStorage.getItem(THEME_STORAGE_KEY);
  const browserPreferredMode = (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  const effectiveThemeMode = savedThemeMode || browserPreferredMode;

  initial = {
    ...initial,
    meta: {
      ...initial.meta,
      previewMode: effectiveThemeMode
    }
  };

  /* 初始化語系 */
  setI18nLocale(initial.meta.locale || "zh-TW");

  /* 2. 建立 Store */
  const store = createStore(reducer, initial);

  /* 3. DOM 節點快取 */
  const topbarTitleEl = document.getElementById("topbar-title");
  const themeTabs = document.getElementById("theme-tabs");
  const fullscreenToggle = document.getElementById("fullscreen-toggle");
  const localeTabs = document.getElementById("locale-tabs");
  const resetBtn = document.getElementById("reset-btn");
  const exportJsonBtn = document.getElementById("export-json-btn");

  const leftPanelEl = document.getElementById("left-panel");
  const mainStageEl = document.getElementById("main-stage");
  const previewRootEl = document.getElementById("preview-root");
  const previewLoadingEl = document.getElementById("preview-loading");

  const mobileTabSettings = document.getElementById("mobile-tab-settings");
  const mobileTabPreview = document.getElementById("mobile-tab-preview");

  const resetDialog = document.getElementById("reset-dialog");
  const resetConfirmBtn = document.getElementById("reset-confirm-btn");
  const resetCancelBtn = document.getElementById("reset-cancel-btn");
  const devActionsSlot = document.getElementById("dev-actions-slot");

  /**
   * 4. 初始化預覽 DOM (SPEC 3.2 Rule 1: 僅建立一次，後續永不重建)
   * 5. 右側預覽區初始化
   */
  const preview = initPreviewRoot(previewRootEl, store);
  const loadingIndicator = createLoadingIndicator(previewLoadingEl);

  /* 5. 掛載設定區塊 */
  const panelsSlot = document.getElementById("panels-slot");

  const panels = [
    createColorsPanel(store),
    createTypographyPanel(store),
    createElevationShapePanel(store)
  ];

  panels.forEach(p => panelsSlot.appendChild(p.block));

  /* 6. Token 注入排程器 (以 rAF 合併同一幀內的多次 dispatch) */
  const batchApplyTokens = createRafBatcher((state) => {
    loadingIndicator.start();
    const { tokenMap } = deriveTokens(state);
    applyTokens(previewRootEl, tokenMap);
    previewRootEl.setAttribute("data-mode", state.meta.previewMode);
    previewRootEl.setAttribute("data-locale", state.meta.locale);
    loadingIndicator.end();
  });

  /* 8. localStorage 寫入排程器 (Debounce 500ms, SPEC 13.1) */
  const saveStateDebounced = debounce((state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("localStorage save failed", e);
    }
  }, 500);

  /* 對比度狀態更新器（支援 AA 與 AAA 等級評判，即時響應語言與模式） */
  function updateA11yBadge(state) {
    const a11yBadgeEl = document.getElementById("a11y-badge");
    const a11yBadgeTextEl = document.getElementById("a11y-badge-text");
    const a11yFixBtnEl = document.getElementById("a11y-fix-btn");

    if (!a11yBadgeEl || !a11yBadgeTextEl) return;

    const audit = runA11yAudit(state, state.meta.previewMode);

    if (audit.level === "AAA") {
      a11yBadgeEl.className = "a11y-badge pass pass-aaa";
      a11yBadgeTextEl.textContent = t("a11y.contrast.passAaa") || "Contrast Passed (AAA)";
      if (a11yFixBtnEl) {
        a11yFixBtnEl.style.display = "none";
        a11yFixBtnEl.textContent = t("a11y.autofix");
      }
    } else if (audit.level === "AA") {
      a11yBadgeEl.className = "a11y-badge pass";
      a11yBadgeTextEl.textContent = t("a11y.contrast.passAa") || "Contrast Passed (AA)";
      if (a11yFixBtnEl) {
        a11yFixBtnEl.style.display = "none";
        a11yFixBtnEl.textContent = t("a11y.autofix");
      }
    } else {
      a11yBadgeEl.className = "a11y-badge fail";
      a11yBadgeTextEl.textContent = t("a11y.contrast.fail") || "Contrast Failed";
      if (a11yFixBtnEl) {
        a11yFixBtnEl.style.display = "inline-block";
        a11yFixBtnEl.textContent = t("a11y.autofix");
      }
    }
  }

  /* 10. 全域 Store 訂閱器 */
  store.subscribe((state, action) => {
    /* 同步 i18n 模組語系 */
    setI18nLocale(state.meta.locale || "zh-TW");

    /* A. 注入 Token */
    batchApplyTokens(state);

    /* C. 持久化 */
    saveStateDebounced(state);

    /* D. 同步各子面板與預覽 */
    panels.forEach(p => p.update(state));
    if (preview && preview.update) preview.update(state);

    /* E. 同步 UI 控制項狀態 */
    syncUIControls(state);
  });

  /* 同步 UI 控制項狀態 */
  function syncUIControls(state) {
    if (leftPanelEl) {
      leftPanelEl.style.width = `${state.ui.leftPanelWidth}px`;
    }

    /* 更新預覽容器屬性 */
    if (previewRootEl) {
      previewRootEl.setAttribute("data-mode", state.meta.previewMode);
      previewRootEl.setAttribute("data-locale", state.meta.locale);
    }

    /* 預覽模式按鈕狀態 */
    if (themeTabs) {
      Array.from(themeTabs.children).forEach(btn => {
        if (btn.dataset.theme === state.meta.previewMode) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }

    /* 語言按鈕狀態與文字 */
    if (localeTabs) {
      Array.from(localeTabs.children).forEach(btn => {
        const btnLocale = (btn.dataset.locale || "").toLowerCase();
        const stateLocale = (state.meta.locale || "").toLowerCase();
        if (btnLocale === stateLocale) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }

    /* 頂端列文字（隨語言切換） */
    if (topbarTitleEl) topbarTitleEl.textContent = t("topbar.title");
    document.title = t("topbar.title") || "Design Token Builder";
    if (resetBtn) resetBtn.textContent = t("topbar.reset");
    if (exportJsonBtn) exportJsonBtn.textContent = t("topbar.export");
    if (mobileTabSettings) mobileTabSettings.textContent = t("tab.settings");
    if (mobileTabPreview) mobileTabPreview.textContent = t("tab.preview");
    if (fullscreenToggle) fullscreenToggle.title = t("topbar.fullscreen");

    const lightThemeBtn = themeTabs ? themeTabs.querySelector('[data-theme="light"]') : null;
    const darkThemeBtn = themeTabs ? themeTabs.querySelector('[data-theme="dark"]') : null;
    if (lightThemeBtn) lightThemeBtn.title = t("colors.surfaceOverride.light");
    if (darkThemeBtn) darkThemeBtn.title = t("colors.surfaceOverride.dark");

    /* 對比度檢查結果徽章更新 (Item 14 - 支援 AA / AAA 級檢測) */
    updateA11yBadge(state);

    /* 重設對話框多語 */
    const resetDialogTitle = document.getElementById("reset-dialog-title");
    const resetDialogMsg = document.getElementById("reset-dialog-msg");
    if (resetDialogTitle) resetDialogTitle.textContent = t("topbar.reset.confirm.title");
    if (resetDialogMsg) resetDialogMsg.textContent = t("topbar.reset.confirm.msg");
    if (resetCancelBtn) resetCancelBtn.textContent = t("topbar.reset.confirm.cancel");
    if (resetConfirmBtn) resetConfirmBtn.textContent = t("topbar.reset.confirm.ok");
  }

  /* 語言切換 (Item 1: 僅套用在預覽區塊，頂端列與左側調整區塊皆使用中文) */
  localeTabs.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target || !target.dataset.locale) return;
    const nextLocale = target.dataset.locale; /* Either "zh-TW" or "en" */

    /* 同步更新 i18n 模組（讓 panels 的 t() 呼叫能正確切換語言） */
    setI18nLocale(nextLocale);

    /* 立即更新按鈕的 active 狀態（不依賴 subscribe 延遲） */
    Array.from(localeTabs.children).forEach(btn => {
      if (btn.dataset.locale === nextLocale) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    store.dispatch(setLocale(nextLocale));
  });

  /* 對比度自動修正按鈕 (Item 14) */
  const a11yFixBtn = document.getElementById("a11y-fix-btn");
  if (a11yFixBtn) {
    a11yFixBtn.addEventListener("click", () => {
      const state = store.getState();
      const fixedState = fixA11yIssues(state);
      store.dispatch(hydrate(fixedState));
    });
  }

  /* 預覽模式切換 (Light / Dark - 記憶使用者選擇) */
  themeTabs.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target || !target.dataset.theme) return;
    const nextTheme = target.dataset.theme;
    
    /* 立即更新按鈕的 active 狀態 */
    Array.from(themeTabs.children).forEach(btn => {
      if (btn.dataset.theme === nextTheme) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    try {
      localStorage.setItem("byds:theme_mode", nextTheme);
    } catch (err) {
      console.warn("Save theme preference failed", err);
    }
    store.dispatch(setPreviewMode(nextTheme));
  });

  /* 全螢幕切換 (SPEC 9.6) */
  fullscreenToggle.addEventListener("click", () => {
    toggleFullscreen(previewRootEl);
  });

  /* 重設對話框 (SPEC 9.2) */
  resetBtn.addEventListener("click", () => resetDialog.showModal());
  resetCancelBtn.addEventListener("click", () => resetDialog.close());
  resetConfirmBtn.addEventListener("click", () => {
    store.dispatch(resetAll());
    window.dispatchEvent(new Event('app:reset'));
    resetDialog.close();
  });

  /* 匯出 JSON（產生標準 W3C DTCG 規格之 design-tokens.json） */
  exportJsonBtn.addEventListener("click", () => {
    const state = store.getState();
    const dtcg = stateToDtcg(state);
    const jsonContent = JSON.stringify(dtcg, null, 2);
    downloadFile("design-tokens.json", jsonContent, "application/json;charset=utf-8");
  });

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* 12. 分隔線拖拉 (已完全移除) */

  /* 13. 行動版分頁列切換 (< 1024px, SPEC 9.5) */
  mobileTabSettings.addEventListener("click", () => {
    mobileTabSettings.classList.add("active");
    mobileTabPreview.classList.remove("active");
    leftPanelEl.classList.add("mobile-active");
    mainStageEl.classList.remove("mobile-active");
  });

  mobileTabPreview.addEventListener("click", () => {
    mobileTabPreview.classList.add("active");
    mobileTabSettings.classList.remove("active");
    leftPanelEl.classList.remove("mobile-active");
    mainStageEl.classList.add("mobile-active");
  });

  /* 14. 開發者模式 Export as Preset (SPEC 2.4: 網址 ?dev=1 時才渲染) */
  if (window.location.search.includes("dev=1")) {
    const devBtn = document.createElement("button");
    devBtn.className = "panel-action-btn";
    devBtn.textContent = "Export as Preset";
    devBtn.style.color = "var(--app-warning)";
    devBtn.style.borderColor = "var(--app-warning)";

    devBtn.addEventListener("click", () => {
      const state = store.getState();
      const snippet = JSON.stringify(state, null, 2);
      navigator.clipboard.writeText(snippet).then(() => {
        alert("已將 AppState 複製到剪貼簿，可直接貼回 presets.js！");
      });
    });

    devActionsSlot.appendChild(devBtn);
  }

  /* 首次觸發 Token 注入與無障礙狀態更新 */
  batchApplyTokens(store.getState());
  panels.forEach(p => p.update(store.getState()));
  if (preview && preview.update) preview.update(store.getState());
  if (leftPanelEl) leftPanelEl.style.width = `${store.getState().ui.leftPanelWidth}px`;
  updateA11yBadge(store.getState());
  syncUIControls(store.getState());
}

/* 頁面載入完成啟動 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
