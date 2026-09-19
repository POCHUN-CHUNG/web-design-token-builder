/* 設定區塊 3：字體（完全遵循使用者要求：全量 Google Fonts 搜尋、A-Z 升冪排序、英中各三款、無備用字型） */
import { createPanelBlock } from "./panelBase.js";
import { patch, setTypeOverride, clearTypeOverride } from "../core/actions.js";
import { ALL_FONTS, CJK_FONTS } from "../fonts/catalog.js";
import { ensureFont } from "../fonts/loader.js";
import { TYPE_SCALE_TABLE } from "../tokens/derive.js";
import { t } from "../i18n/index.js";

export function createTypographyPanel(store) {
  let headingCombobox, bodyCombobox, labelCombobox;
  let cjkHeadingCombobox, cjkBodyCombobox, cjkLabelCombobox;
  let baseSizeInput, ratioInput;
  let stepsContainer;
  /* 字型區段標題與欄位標籤（需隨語言切換） */
  let engSectionTitle, cjkSectionTitle;
  let headingLbl, bodyLbl, labelLbl;
  let cjkHeadingLbl, cjkBodyLbl, cjkLabelLbl;
  let baseSizeLbl, ratioLbl;

  function createSearchableFontSelect(initialVal, isCjkOnly = false, onChange) {
    const container = document.createElement("div");
    container.className = "font-combobox-container";
    container.style.position = "relative";
    container.style.flex = "1";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "ctrl-input font-combobox-input";
    input.value = initialVal || "";
    input.placeholder = t("typography.searchPlaceholder") || "搜尋字型...";
    input.style.width = "100%";
    input.style.boxSizing = "border-box";

    const dropdown = document.createElement("div");
    dropdown.className = "font-combobox-dropdown";
    dropdown.style.display = "none";
    dropdown.style.position = "absolute";
    dropdown.style.top = "100%";
    dropdown.style.left = "0";
    dropdown.style.right = "0";
    dropdown.style.maxHeight = "180px";
    dropdown.style.overflowY = "auto";
    dropdown.style.background = "var(--app-surface, #1e1e24)";
    dropdown.style.border = "1px solid var(--app-border, #3f3f46)";
    dropdown.style.borderRadius = "var(--app-radius-sm, 4px)";
    dropdown.style.zIndex = "1000";
    dropdown.style.boxShadow = "0 8px 16px rgba(0,0,0,0.35)";

    const fontList = isCjkOnly ? CJK_FONTS : ALL_FONTS;

    function renderOptions(filter = "") {
      dropdown.innerHTML = "";
      const lower = filter.trim().toLowerCase();
      const matches = lower ? fontList.filter(f => f.toLowerCase().includes(lower)) : fontList;

      if (matches.length === 0) {
        const empty = document.createElement("div");
        empty.style.padding = "6px 10px";
        empty.style.fontSize = "12px";
        empty.style.color = "var(--app-text-muted)";
        empty.textContent = t("typography.noResult") || "查無字型";
        dropdown.appendChild(empty);
        return;
      }

      const limit = matches.slice(0, 100);
      for (const font of limit) {
        const opt = document.createElement("div");
        opt.className = "font-combobox-option";
        opt.style.padding = "6px 10px";
        opt.style.fontSize = "12px";
        opt.style.cursor = "pointer";
        opt.style.color = "var(--app-text, #ffffff)";
        opt.textContent = font;
        if (font === input.value) {
          opt.style.backgroundColor = "var(--app-primary-subtle, rgba(0, 255, 204, 0.15))";
          opt.style.color = "var(--app-primary, #00ffcc)";
        }
        opt.addEventListener("mouseenter", () => {
          opt.style.backgroundColor = "var(--app-surface-hover, rgba(255,255,255,0.08))";
        });
        opt.addEventListener("mouseleave", () => {
          opt.style.backgroundColor = font === input.value ? "var(--app-primary-subtle, rgba(0, 255, 204, 0.15))" : "transparent";
        });
        opt.addEventListener("mousedown", (e) => {
          e.preventDefault();
          selectFont(font);
        });
        dropdown.appendChild(opt);
      }
    }

    function selectFont(font) {
      input.value = font;
      dropdown.style.display = "none";
      onChange(font);
      ensureFont(font);
    }

    input.addEventListener("focus", () => {
      renderOptions(input.value);
      dropdown.style.display = "block";
    });

    input.addEventListener("input", () => {
      renderOptions(input.value);
      dropdown.style.display = "block";
    });

    input.addEventListener("blur", () => {
      const exact = fontList.find(f => f.toLowerCase() === input.value.trim().toLowerCase());
      if (exact) {
        selectFont(exact);
      }
      dropdown.style.display = "none";
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const firstOpt = dropdown.querySelector(".font-combobox-option");
        if (firstOpt && firstOpt.textContent !== (t("typography.noResult") || "查無字型")) {
          selectFont(firstOpt.textContent);
        }
        input.blur();
      } else if (e.key === "Escape") {
        dropdown.style.display = "none";
      }
    });

    container.appendChild(input);
    container.appendChild(dropdown);

    return {
      element: container,
      getValue: () => input.value,
      setValue: (val) => {
        input.value = val;
      },
      inputEl: input
    };
  }

  const block = createPanelBlock({
    id: "typography",
    titleKey: "panel.typography.title",
    store,
    renderContent(container, store) {
      /* 1. 英文字型 */
      engSectionTitle = document.createElement("div");
      engSectionTitle.style.fontSize = "12px";
      engSectionTitle.style.fontWeight = "600";
      engSectionTitle.style.color = "var(--app-text-muted)";
      engSectionTitle.style.marginBottom = "4px";
      engSectionTitle.textContent = t("typography.engFont") || "英文字型";
      container.appendChild(engSectionTitle);

      const headingRow = document.createElement("div");
      headingRow.className = "ctrl-row";
      headingLbl = document.createElement("label");
      headingLbl.className = "ctrl-label";
      headingLbl.textContent = t("typography.headingFont") || "標題";
      headingCombobox = createSearchableFontSelect("Roboto", false, (val) => store.dispatch(patch("typography.families.heading", val)));
      headingRow.appendChild(headingLbl);
      headingRow.appendChild(headingCombobox.element);
      container.appendChild(headingRow);

      const bodyRow = document.createElement("div");
      bodyRow.className = "ctrl-row";
      bodyLbl = document.createElement("label");
      bodyLbl.className = "ctrl-label";
      bodyLbl.textContent = t("typography.bodyFont") || "內文";
      bodyCombobox = createSearchableFontSelect("Roboto", false, (val) => store.dispatch(patch("typography.families.body", val)));
      bodyRow.appendChild(bodyLbl);
      bodyRow.appendChild(bodyCombobox.element);
      container.appendChild(bodyRow);

      const labelRow = document.createElement("div");
      labelRow.className = "ctrl-row";
      labelLbl = document.createElement("label");
      labelLbl.className = "ctrl-label";
      labelLbl.textContent = t("typography.monoFont") || "標籤";
      labelCombobox = createSearchableFontSelect("Roboto", false, (val) => store.dispatch(patch("typography.families.label", val)));
      labelRow.appendChild(labelLbl);
      labelRow.appendChild(labelCombobox.element);
      container.appendChild(labelRow);

      /* 2. 中文字型 */
      cjkSectionTitle = document.createElement("div");
      cjkSectionTitle.style.fontSize = "12px";
      cjkSectionTitle.style.fontWeight = "600";
      cjkSectionTitle.style.color = "var(--app-text-muted)";
      cjkSectionTitle.style.marginTop = "12px";
      cjkSectionTitle.style.marginBottom = "4px";
      cjkSectionTitle.textContent = t("typography.cjkFont") || "中文字型";
      container.appendChild(cjkSectionTitle);

      const cjkHeadingRow = document.createElement("div");
      cjkHeadingRow.className = "ctrl-row";
      cjkHeadingLbl = document.createElement("label");
      cjkHeadingLbl.className = "ctrl-label";
      cjkHeadingLbl.textContent = t("typography.headingFont") || "標題";
      cjkHeadingCombobox = createSearchableFontSelect("Noto Sans TC", true, (val) => store.dispatch(patch("typography.families.cjkHeading", val)));
      cjkHeadingRow.appendChild(cjkHeadingLbl);
      cjkHeadingRow.appendChild(cjkHeadingCombobox.element);
      container.appendChild(cjkHeadingRow);

      const cjkBodyRow = document.createElement("div");
      cjkBodyRow.className = "ctrl-row";
      cjkBodyLbl = document.createElement("label");
      cjkBodyLbl.className = "ctrl-label";
      cjkBodyLbl.textContent = t("typography.bodyFont") || "內文";
      cjkBodyCombobox = createSearchableFontSelect("Noto Sans TC", true, (val) => store.dispatch(patch("typography.families.cjkBody", val)));
      cjkBodyRow.appendChild(cjkBodyLbl);
      cjkBodyRow.appendChild(cjkBodyCombobox.element);
      container.appendChild(cjkBodyRow);

      const cjkLabelRow = document.createElement("div");
      cjkLabelRow.className = "ctrl-row";
      cjkLabelLbl = document.createElement("label");
      cjkLabelLbl.className = "ctrl-label";
      cjkLabelLbl.textContent = t("typography.monoFont") || "標籤";
      cjkLabelCombobox = createSearchableFontSelect("Noto Sans TC", true, (val) => store.dispatch(patch("typography.families.cjkLabel", val)));
      cjkLabelRow.appendChild(cjkLabelLbl);
      cjkLabelRow.appendChild(cjkLabelCombobox.element);
      container.appendChild(cjkLabelRow);

      /* 3. 基準字級與比例 */
      const separator = document.createElement("div");
      separator.style.borderTop = "1px solid var(--app-border)";
      separator.style.margin = "16px 0 12px 0";
      container.appendChild(separator);

      const baseRow = document.createElement("div");
      baseRow.className = "ctrl-row";
      baseSizeLbl = document.createElement("label");
      baseSizeLbl.className = "ctrl-label";
      baseSizeLbl.textContent = t("typography.baseSize");
      baseSizeInput = document.createElement("input");
      baseSizeInput.type = "number";
      baseSizeInput.className = "ctrl-input";
      baseSizeInput.min = 12;
      baseSizeInput.max = 24;
      baseSizeInput.value = 16;
      baseSizeInput.addEventListener("change", (e) => {
        const val = Math.max(12, Math.min(24, parseInt(e.target.value) || 16));
        store.dispatch(patch("typography.scale.baseSize", val));
      });
      baseRow.appendChild(baseSizeLbl);
      baseRow.appendChild(baseSizeInput);
      container.appendChild(baseRow);

      const ratioRow = document.createElement("div");
      ratioRow.className = "ctrl-row";
      ratioLbl = document.createElement("label");
      ratioLbl.className = "ctrl-label";
      ratioLbl.textContent = t("typography.ratio");
      ratioInput = document.createElement("input");
      ratioInput.type = "number";
      ratioInput.className = "ctrl-input";
      ratioInput.min = 1.05;
      ratioInput.max = 1.618;
      ratioInput.step = 0.005;
      ratioInput.value = 1.25;
      ratioInput.addEventListener("change", (e) => {
        const val = Math.max(1.05, Math.min(1.618, parseFloat(e.target.value) || 1.25));
        store.dispatch(patch("typography.scale.ratio", Math.round(val * 1000) / 1000));
      });
      ratioRow.appendChild(ratioLbl);
      ratioRow.appendChild(ratioInput);
      container.appendChild(ratioRow);

      /* 4. 9 階微調清單 */
      stepsContainer = document.createElement("div");
      stepsContainer.style.display = "flex";
      stepsContainer.style.flexDirection = "column";
      stepsContainer.style.gap = "8px";
      stepsContainer.style.borderTop = "1px solid var(--app-border)";
      stepsContainer.style.paddingTop = "12px";
      container.appendChild(stepsContainer);
    }
  });

  const originalUpdate = block.update;
  block.update = function (state) {
    originalUpdate(state);
    const { typography } = state;

    /* 隨語言切換更新標籤文字 */
    if (engSectionTitle) engSectionTitle.textContent = t("typography.engFont") || "英文字型";
    if (cjkSectionTitle) cjkSectionTitle.textContent = t("typography.cjkFont") || "中文字型";
    if (headingLbl)    headingLbl.textContent    = t("typography.headingFont") || "標題";
    if (bodyLbl)       bodyLbl.textContent       = t("typography.bodyFont")    || "內文";
    if (labelLbl)      labelLbl.textContent      = t("typography.monoFont")    || "標籤";
    if (cjkHeadingLbl) cjkHeadingLbl.textContent = t("typography.headingFont") || "標題";
    if (cjkBodyLbl)    cjkBodyLbl.textContent    = t("typography.bodyFont")    || "內文";
    if (cjkLabelLbl)   cjkLabelLbl.textContent   = t("typography.monoFont")   || "標籤";

    const placeholderText = t("typography.searchPlaceholder") || "搜尋字型...";
    if (headingCombobox && headingCombobox.inputEl) headingCombobox.inputEl.placeholder = placeholderText;
    if (bodyCombobox && bodyCombobox.inputEl) bodyCombobox.inputEl.placeholder = placeholderText;
    if (labelCombobox && labelCombobox.inputEl) labelCombobox.inputEl.placeholder = placeholderText;
    if (cjkHeadingCombobox && cjkHeadingCombobox.inputEl) cjkHeadingCombobox.inputEl.placeholder = placeholderText;
    if (cjkBodyCombobox && cjkBodyCombobox.inputEl) cjkBodyCombobox.inputEl.placeholder = placeholderText;
    if (cjkLabelCombobox && cjkLabelCombobox.inputEl) cjkLabelCombobox.inputEl.placeholder = placeholderText;

    if (baseSizeLbl)   baseSizeLbl.textContent   = t("typography.baseSize");
    if (ratioLbl)      ratioLbl.textContent      = t("typography.ratio");

    if (headingCombobox && headingCombobox.getValue() !== typography.families.heading) {
      headingCombobox.setValue(typography.families.heading);
      ensureFont(typography.families.heading);
    }
    if (bodyCombobox && bodyCombobox.getValue() !== typography.families.body) {
      bodyCombobox.setValue(typography.families.body);
      ensureFont(typography.families.body);
    }
    if (labelCombobox && typography.families.label && labelCombobox.getValue() !== typography.families.label) {
      labelCombobox.setValue(typography.families.label);
      ensureFont(typography.families.label);
    }
    if (cjkHeadingCombobox && typography.families.cjkHeading && cjkHeadingCombobox.getValue() !== typography.families.cjkHeading) {
      cjkHeadingCombobox.setValue(typography.families.cjkHeading);
      ensureFont(typography.families.cjkHeading);
    }
    if (cjkBodyCombobox && typography.families.cjkBody && cjkBodyCombobox.getValue() !== typography.families.cjkBody) {
      cjkBodyCombobox.setValue(typography.families.cjkBody);
      ensureFont(typography.families.cjkBody);
    }
    if (cjkLabelCombobox && typography.families.cjkLabel && cjkLabelCombobox.getValue() !== typography.families.cjkLabel) {
      cjkLabelCombobox.setValue(typography.families.cjkLabel);
      ensureFont(typography.families.cjkLabel);
    }

    if (baseSizeInput) baseSizeInput.value = typography.scale.baseSize;
    if (ratioInput) ratioInput.value = typography.scale.ratio;


    /* 渲染 9 階微調列表 */
    if (stepsContainer) {
      stepsContainer.innerHTML = "";
      const baseSize = typography.scale.baseSize || 16;
      const ratio = typography.scale.ratio || 1.25;
      const overrides = typography.overrides || {};

      for (const [step, def] of Object.entries(TYPE_SCALE_TABLE)) {
        const computedSize = Math.round(baseSize * Math.pow(ratio, def.power));
        const ovr = overrides[step] || {};
        const isOverridden = Object.keys(ovr).length > 0;

        const row = document.createElement("div");
        row.style.background = "transparent";
        row.style.border = "none";
        row.style.padding = "8px 0";

        const rowHeader = document.createElement("div");
        rowHeader.style.display = "flex";
        rowHeader.style.justifyContent = "space-between";
        rowHeader.style.alignItems = "center";

        const titleSpan = document.createElement("span");
        titleSpan.style.fontSize = "12px";
        titleSpan.style.fontWeight = "600";
        titleSpan.style.color = "var(--app-text-muted)";
        titleSpan.textContent = step;

        const actionsDiv = document.createElement("div");
        actionsDiv.style.display = "flex";
        actionsDiv.style.gap = "6px";
        actionsDiv.style.alignItems = "center";

        if (isOverridden) {
          const resetBtn = document.createElement("button");
          resetBtn.className = "panel-action-btn";
          resetBtn.type = "button";
          resetBtn.title = t("action.reset");
          resetBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>`;
          resetBtn.style.padding = "4px";
          resetBtn.style.display = "inline-flex";
          resetBtn.style.alignItems = "center";
          resetBtn.style.justifyContent = "center";
          resetBtn.style.border = "none";
          resetBtn.style.background = "transparent";
          resetBtn.addEventListener("click", () => store.dispatch(clearTypeOverride(step)));
          actionsDiv.appendChild(resetBtn);
        }

        const toggleBtn = document.createElement("button");
        toggleBtn.className = "panel-action-btn";
        toggleBtn.type = "button";
        toggleBtn.title = t("action.tweak");
        toggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
        toggleBtn.style.padding = "4px";
        toggleBtn.style.display = "inline-flex";
        toggleBtn.style.alignItems = "center";
        toggleBtn.style.justifyContent = "center";
        toggleBtn.style.border = "none";
        toggleBtn.style.background = "transparent";

        const editBox = document.createElement("div");
        editBox.className = "type-override-box";
        editBox.style.display = "none";
        editBox.style.border = "none";
        editBox.style.background = "transparent";
        editBox.style.padding = "8px 0";

        /* 4 個覆寫輸入 */
        const props = [
          { key: "fontSize", label: t("typography.fontSize"), defaultVal: computedSize, type: "number" },
          { key: "letterSpacing", label: t("typography.letterSpacing"), defaultVal: parseFloat(def.ls) || 0, type: "number", step: 0.005 },
          { key: "fontWeight", label: t("typography.fontWeight"), defaultVal: def.fw, type: "number" },
          { key: "lineHeight", label: t("typography.lineHeight"), defaultVal: def.lh, type: "number", step: 0.05 }
        ];

        for (const p of props) {
          const field = document.createElement("div");
          const lbl = document.createElement("span");
          lbl.className = "ctrl-label";
          lbl.style.display = "block";
          lbl.style.marginBottom = "4px";
          lbl.textContent = p.label;
          const inp = document.createElement("input");
          inp.type = p.type;
          if (p.step) inp.step = p.step;
          inp.className = "ctrl-input no-spinners";
          inp.style.padding = "2px 6px";
          inp.value = ovr[p.key] ?? p.defaultVal;
          inp.addEventListener("change", (e) => {
            const val = p.type === "number" ? parseFloat(e.target.value) : e.target.value;
            store.dispatch(setTypeOverride(step, p.key, val));
          });
          field.appendChild(lbl);
          field.appendChild(inp);
          editBox.appendChild(field);
        }

        toggleBtn.addEventListener("click", () => {
          editBox.style.display = editBox.style.display === "none" ? "grid" : "none";
        });

        actionsDiv.appendChild(toggleBtn);
        rowHeader.appendChild(titleSpan);
        rowHeader.appendChild(actionsDiv);

        row.appendChild(rowHeader);
        row.appendChild(editBox);
        stepsContainer.appendChild(row);
      }
    }
  };

  block.update(store.getState());
  return block;
}
