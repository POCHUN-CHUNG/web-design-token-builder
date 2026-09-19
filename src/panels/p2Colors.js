/* 設定區塊 2：色彩（完全遵循 SPEC 第 5.1、6.5 與第 9.3.3 節） */
import { createPanelBlock } from "./panelBase.js";
import { patch, addColor, removeColor } from "../core/actions.js";
import { t } from "../i18n/index.js";

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export function createColorsPanel(store) {
  let primariesContainer, accentsContainer, neutralContainer, linkContainer, semanticContainer, surfaceContainer;

  function updateColorItem(row, colorObj, canDelete = true) {
    if (!row || !row._refs) return;
    const { bubble, nativePicker, hexInput, delBtn } = row._refs;
    const seed = colorObj.seed || "#000000";
    bubble.style.backgroundColor = seed;
    if (document.activeElement !== nativePicker && HEX_REGEX.test(seed)) {
      nativePicker.value = seed.toLowerCase();
    }
    if (document.activeElement !== hexInput) {
      hexInput.value = seed.toUpperCase();
      hexInput.classList.remove("error");
    }
    if (delBtn) {
      delBtn.style.display = canDelete ? "inline-flex" : "none";
      delBtn.disabled = !canDelete;
    }
  }

  function renderColorItem(colorObj, onColorChange, onDelete, canDelete = true, isNeutral = false) {
    const row = document.createElement("div");
    row.className = "color-item-row";

    /* 顏色選擇氣泡 */
    const bubble = document.createElement("div");
    bubble.className = "color-picker-bubble";
    bubble.style.backgroundColor = colorObj.seed;

    const nativePicker = document.createElement("input");
    nativePicker.type = "color";
    nativePicker.value = HEX_REGEX.test(colorObj.seed) ? colorObj.seed.toLowerCase() : "#000000";
    nativePicker.addEventListener("input", (e) => {
      const val = e.target.value.toUpperCase();
      bubble.style.backgroundColor = val;
      hexInput.value = val;
      hexInput.classList.remove("error");
      onColorChange(val);
    });
    bubble.appendChild(nativePicker);

    /* 16 進位文字輸入 */
    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.className = "color-hex-input";
    hexInput.maxLength = 7;
    hexInput.value = colorObj.seed ? colorObj.seed.toUpperCase() : "";
    hexInput.addEventListener("input", (e) => {
      const val = e.target.value.trim().toUpperCase();
      if (HEX_REGEX.test(val)) {
        hexInput.classList.remove("error");
        bubble.style.backgroundColor = val;
        nativePicker.value = val.toLowerCase();
        onColorChange(val);
      }
    });
    hexInput.addEventListener("change", (e) => {
      const val = e.target.value.trim().toUpperCase();
      if (HEX_REGEX.test(val)) {
        hexInput.classList.remove("error");
        bubble.style.backgroundColor = val;
        nativePicker.value = val.toLowerCase();
        onColorChange(val);
      } else {
        hexInput.classList.add("error");
      }
    });

    row.appendChild(bubble);
    row.appendChild(hexInput);

    let delBtn = null;
    if (onDelete) {
      delBtn = document.createElement("button");
      delBtn.className = "color-delete-btn";
      delBtn.type = "button";
      delBtn.textContent = "✕";
      delBtn.style.display = canDelete ? "inline-flex" : "none";
      delBtn.disabled = !canDelete;
      delBtn.addEventListener("click", () => onDelete(colorObj.id));
      row.appendChild(delBtn);
    }

    row._refs = {
      bubble,
      nativePicker,
      hexInput,
      delBtn
    };

    return row;
  }

  let priLabel, priAddBtn, accLabel, accAddBtn, neuLabel, linkLabel, semLabel;

  const block = createPanelBlock({
    id: "colors",
    titleKey: "panel.colors.title",
    store,
    renderContent(container, store) {
      /* 1. 主要色 (最多 3 個) */
      const priGroup = document.createElement("div");
      priGroup.className = "ctrl-row";
      const priHeader = document.createElement("div");
      priHeader.style.display = "flex";
      priHeader.style.justifyContent = "space-between";
      priHeader.style.alignItems = "center";
      priHeader.style.gridColumn = "span 2";

      priLabel = document.createElement("label");
      priLabel.className = "ctrl-label";
      priLabel.style.color = "#ffffff";
      priLabel.style.fontWeight = "600";
      priLabel.style.fontSize = "13px";
      priLabel.textContent = "主要（最多 3 個）";

      priAddBtn = document.createElement("button");
      priAddBtn.className = "panel-action-btn";
      priAddBtn.type = "button";
      priAddBtn.textContent = "＋";
      priAddBtn.id = "btn-add-primary";
      priAddBtn.addEventListener("click", () => store.dispatch(addColor("primaries")));

      priHeader.appendChild(priLabel);
      priHeader.appendChild(priAddBtn);
      priGroup.appendChild(priHeader);

      primariesContainer = document.createElement("div");
      primariesContainer.style.display = "flex";
      primariesContainer.style.flexDirection = "column";
      primariesContainer.style.gap = "6px";
      primariesContainer.style.gridColumn = "span 2";
      priGroup.appendChild(primariesContainer);
      container.appendChild(priGroup);

      /* 2. 輔助色 (最多 6 個) - Item 11: 輔助色移至主要色下方 */
      const accGroup = document.createElement("div");
      accGroup.className = "ctrl-row";
      const accHeader = document.createElement("div");
      accHeader.style.display = "flex";
      accHeader.style.justifyContent = "space-between";
      accHeader.style.alignItems = "center";
      accHeader.style.gridColumn = "span 2";

      accLabel = document.createElement("label");
      accLabel.className = "ctrl-label";
      accLabel.style.color = "#ffffff";
      accLabel.style.fontWeight = "600";
      accLabel.style.fontSize = "13px";
      accLabel.textContent = "輔助（最多 6 個）";

      accAddBtn = document.createElement("button");
      accAddBtn.className = "panel-action-btn";
      accAddBtn.type = "button";
      accAddBtn.textContent = "＋";
      accAddBtn.id = "btn-add-accent";
      accAddBtn.addEventListener("click", () => store.dispatch(addColor("accents")));

      accHeader.appendChild(accLabel);
      accHeader.appendChild(accAddBtn);
      accGroup.appendChild(accHeader);

      accentsContainer = document.createElement("div");
      accentsContainer.style.display = "flex";
      accentsContainer.style.flexDirection = "column";
      accentsContainer.style.gap = "6px";
      accentsContainer.style.gridColumn = "span 2";
      accGroup.appendChild(accentsContainer);
      container.appendChild(accGroup);

      /* 3. 中性色 (固定 1 個) */
      const neuGroup = document.createElement("div");
      neuGroup.className = "ctrl-row";
      neuLabel = document.createElement("label");
      neuLabel.className = "ctrl-label";
      neuLabel.style.color = "#ffffff";
      neuLabel.style.fontWeight = "600";
      neuLabel.style.fontSize = "13px";
      neuLabel.textContent = "中性（最多 1 個）";
      neuGroup.appendChild(neuLabel);

      neutralContainer = document.createElement("div");
      neutralContainer.style.gridColumn = "span 2";
      neuGroup.appendChild(neutralContainer);
      container.appendChild(neuGroup);

      /* 3.5 超連結色 (固定 1 個，獨立調整) */
      const linkGroup = document.createElement("div");
      linkGroup.className = "ctrl-row";
      linkLabel = document.createElement("label");
      linkLabel.className = "ctrl-label";
      linkLabel.style.color = "#ffffff";
      linkLabel.style.fontWeight = "600";
      linkLabel.style.fontSize = "13px";
      linkLabel.textContent = "連結（最多 1 個）";
      linkGroup.appendChild(linkLabel);

      linkContainer = document.createElement("div");
      linkContainer.style.gridColumn = "span 2";
      linkGroup.appendChild(linkContainer);
      container.appendChild(linkGroup);

      /* 4. 狀態色 (大區標題「狀態」，白色大區設計風格，排列比照淺色模式) */
      const semGroup = document.createElement("div");
      semGroup.className = "ctrl-row";
      semGroup.style.borderTop = "1px solid var(--app-border)";
      semGroup.style.paddingTop = "12px";

      const semTitle = document.createElement("div");
      semTitle.style.fontSize = "12px";
      semTitle.style.fontWeight = "600";
      semTitle.style.color = "var(--app-text-muted)";
      semTitle.style.marginBottom = "4px";
      semTitle.style.gridColumn = "span 2";
      semTitle.textContent = t("colors.semantic") || "狀態";
      semLabel = semTitle;
      semGroup.appendChild(semTitle);

      semanticContainer = document.createElement("div");
      semanticContainer.style.display = "flex";
      semanticContainer.style.flexDirection = "column";
      semanticContainer.style.gap = "8px";
      semanticContainer.style.gridColumn = "span 2";
      semanticContainer.style.width = "100%";
      semGroup.appendChild(semanticContainer);
      container.appendChild(semGroup);

      /* 5. 表面色覆蓋 (淺色模式 / 深色模式，常態展開，無外框) */
      const surGroup = document.createElement("div");
      surGroup.className = "ctrl-row";
      surGroup.style.borderTop = "1px solid var(--app-border)";
      surGroup.style.paddingTop = "12px";

      surfaceContainer = document.createElement("div");
      surfaceContainer.id = "surface-override-inputs";
      surfaceContainer.style.display = "flex";
      surfaceContainer.style.flexDirection = "column";
      surfaceContainer.style.gap = "14px";
      surfaceContainer.style.gridColumn = "span 2";
      surGroup.appendChild(surfaceContainer);
      container.appendChild(surGroup);
    }
  });

  const originalUpdate = block.update;
  block.update = function (state) {
    originalUpdate(state);
    if (priLabel) priLabel.textContent = t("colors.primaries");
    if (priAddBtn) priAddBtn.textContent = "＋";
    if (accLabel) accLabel.textContent = t("colors.accents");
    if (accAddBtn) accAddBtn.textContent = "＋";
    if (neuLabel) neuLabel.textContent = t("colors.neutral");
    if (linkLabel) linkLabel.textContent = t("colors.link") || "連結（最多 1 個）";
    if (semLabel) semLabel.textContent = t("colors.semantic");

    const mode = state.meta.previewMode || "light";
    const currentColors = state.colors[mode];
    if (!currentColors) return;

    /* 更新 Primary 色彩清單 */
    if (primariesContainer) {
      const primaries = currentColors.primaries || [];
      const addBtn = block.block.querySelector("#btn-add-primary");
      if (addBtn) addBtn.disabled = primaries.length >= 3;

      if (primariesContainer.children.length === primaries.length) {
        primaries.forEach((col, idx) => {
          updateColorItem(primariesContainer.children[idx], col, primaries.length > 1);
        });
      } else {
        primariesContainer.innerHTML = "";
        primaries.forEach((col, idx) => {
          const item = renderColorItem(
            col,
            (newSeed) => {
              const currentMode = store.getState().meta.previewMode || "light";
              const latestColors = store.getState().colors[currentMode];
              const updated = latestColors.primaries.map((c, i) => (i === idx ? { ...c, seed: newSeed } : c));
              store.dispatch(patch(`colors.${currentMode}.primaries`, updated));
            },
            (id) => store.dispatch(removeColor("primaries", id)),
            primaries.length > 1
          );
          primariesContainer.appendChild(item);
        });
      }
    }

    /* 更新 Accents (最多 6 個) */
    if (accentsContainer) {
      const accents = currentColors.accents || [];
      const addBtn = block.block.querySelector("#btn-add-accent");
      if (addBtn) addBtn.disabled = accents.length >= 6;

      if (accentsContainer.children.length === accents.length) {
        accents.forEach((col, idx) => {
          updateColorItem(accentsContainer.children[idx], col, true);
        });
      } else {
        accentsContainer.innerHTML = "";
        accents.forEach((col, idx) => {
          const item = renderColorItem(
            col,
            (newSeed) => {
              const currentMode = store.getState().meta.previewMode || "light";
              const latestColors = store.getState().colors[currentMode];
              const updated = latestColors.accents.map((c, i) => (i === idx ? { ...c, seed: newSeed } : c));
              store.dispatch(patch(`colors.${currentMode}.accents`, updated));
            },
            (id) => store.dispatch(removeColor("accents", id)),
            true
          );
          accentsContainer.appendChild(item);
        });
      }
    }

    /* 更新 Neutral */
    if (neutralContainer && currentColors.neutral) {
      if (neutralContainer.children.length === 1) {
        updateColorItem(neutralContainer.children[0], currentColors.neutral, false);
      } else {
        neutralContainer.innerHTML = "";
        const item = renderColorItem(
          currentColors.neutral,
          (newSeed) => {
            const currentMode = store.getState().meta.previewMode || "light";
            store.dispatch(patch(`colors.${currentMode}.neutral.seed`, newSeed));
          },
          null,
          false,
          true
        );
        neutralContainer.appendChild(item);
      }
    }

    /* 更新 Link */
    if (linkContainer) {
      const linkObj = currentColors.link || { id: "link", seed: "#7F5539" };
      if (linkContainer.children.length === 1) {
        updateColorItem(linkContainer.children[0], linkObj, false);
      } else {
        linkContainer.innerHTML = "";
        const item = renderColorItem(
          linkObj,
          (newSeed) => {
            const currentMode = store.getState().meta.previewMode || "light";
            store.dispatch(patch(`colors.${currentMode}.link.seed`, newSeed));
          },
          null,
          false,
          true
        );
        linkContainer.appendChild(item);
      }
    }

    /* 更新 Semantic 狀態色 */
    if (semanticContainer && currentColors.semantic) {
      let semInputsMap = semanticContainer._inputsMap;
      if (!semInputsMap) {
        semanticContainer.innerHTML = "";
        semInputsMap = {};
        semanticContainer._inputsMap = semInputsMap;

        const semItems = [
          { key: "success", label: "成功", defaultColor: "#15803d" },
          { key: "warning", label: "警告", defaultColor: "#b45309" },
          { key: "error",   label: "錯誤", defaultColor: "#b91c1c" },
          { key: "info",    label: "資訊", defaultColor: "#0369a1" }
        ];

        semItems.forEach(({ key, label, defaultColor }) => {
          const propGroup = document.createElement("div");
          propGroup.className = "surface-prop-row";
          propGroup.style.display = "flex";
          propGroup.style.alignItems = "center";
          propGroup.style.gap = "10px";
          propGroup.style.width = "100%";

          const propLbl = document.createElement("span");
          propLbl.className = "ctrl-label";
          propLbl.style.minWidth = "85px";
          propLbl.style.flexShrink = "0";
          propLbl.style.color = "#ffffff";
          propLbl.style.fontWeight = "500";
          propLbl.textContent = t(`colors.semantic.${key}`) || label;
          propGroup.appendChild(propLbl);

          const initialSeed = currentColors.semantic[key] || defaultColor;
          const colorItem = renderColorItem(
            { seed: initialSeed },
            (newSeed) => {
              const currentMode = store.getState().meta.previewMode || "light";
              store.dispatch(patch(`colors.${currentMode}.semantic.${key}`, newSeed));
            },
            null,
            false
          );
          colorItem.style.flex = "1";
          colorItem.style.minWidth = "0";

          semInputsMap[key] = {
            bubble: colorItem.querySelector(".color-picker-bubble"),
            nativePicker: colorItem.querySelector("input[type='color']"),
            hexInput: colorItem.querySelector(".color-hex-input"),
            labelEl: propLbl
          };

          propGroup.appendChild(colorItem);
          semanticContainer.appendChild(propGroup);
        });
      }

      /* 同步狀態色值與標籤 */
      Object.keys(semInputsMap).forEach(key => {
        const currentVal = currentColors.semantic[key];
        const el = semInputsMap[key];
        if (el) {
          if (el.labelEl) {
            el.labelEl.textContent = t(`colors.semantic.${key}`) || key;
          }
          if (currentVal) {
            if (el.hexInput !== document.activeElement) {
              el.hexInput.value = currentVal.toLowerCase();
            }
            el.bubble.style.backgroundColor = currentVal;
            if (HEX_REGEX.test(currentVal)) {
              el.nativePicker.value = currentVal.toLowerCase();
            }
          }
        }
      });
    }

    /* 表面色覆蓋 */
    if (surfaceContainer) {
      let inputsMap = surfaceContainer._inputsMap;
      if (!inputsMap) {
        surfaceContainer.innerHTML = "";
        inputsMap = {};
        surfaceContainer._inputsMap = inputsMap;

        const props = [
          { key: "bg",      label: "背景" },
          { key: "surface", label: "卡片" },
          { key: "btnSecondaryBg", label: "次要" },
          { key: "btnInvertedBg", label: "反轉" },
          { key: "text",    label: "文字" },
          { key: "border",  label: "邊框" }
        ];

        const modeSection = document.createElement("div");
        modeSection.style.display = "flex";
        modeSection.style.flexDirection = "column";
        modeSection.style.gap = "8px";
        modeSection.style.width = "100%";

        const modeTitle = document.createElement("div");
        modeTitle.style.fontSize = "12px";
        modeTitle.style.fontWeight = "600";
        modeTitle.style.color = "var(--app-text-muted)";
        modeTitle.style.marginBottom = "2px";
        // Title updates dynamically via update() below based on current mode
        modeSection.appendChild(modeTitle);
        inputsMap[`_title`] = modeTitle;

        props.forEach(({ key: prop, label }) => {
          const propGroup = document.createElement("div");
          propGroup.className = "surface-prop-row";
          propGroup.style.display = "flex";
          propGroup.style.alignItems = "center";
          propGroup.style.gap = "10px";
          propGroup.style.width = "100%";

          const propLbl = document.createElement("span");
          propLbl.className = "ctrl-label";
          propLbl.style.minWidth = "85px";
          propLbl.style.flexShrink = "0";
          propLbl.style.color = "#ffffff";
          propLbl.style.fontWeight = "500";
          propLbl.textContent = t(`colors.surface.${prop}`) || label;
          inputsMap[`${prop}_label`] = propLbl;
          propGroup.appendChild(propLbl);

          const initialSeed = currentColors.surface?.[prop] || (mode === "light" ? "#ffffff" : "#000000");
          const colorItem = renderColorItem(
            { seed: initialSeed },
            (newSeed) => {
              // Since mode is bound in closure from creation time, we need to read the CURRENT mode dynamically!
              const currentMode = store.getState().meta.previewMode || "light";
              store.dispatch(patch(`colors.${currentMode}.surface.${prop}`, newSeed));
            },
            null,
            false
          );
          colorItem.style.flex = "1";
          colorItem.style.minWidth = "0";

          inputsMap[prop] = {
            bubble: colorItem.querySelector(".color-picker-bubble"),
            nativePicker: colorItem.querySelector("input[type='color']"),
            hexInput: colorItem.querySelector(".color-hex-input"),
            labelEl: propLbl
          };

          propGroup.appendChild(colorItem);
          modeSection.appendChild(propGroup);
        });

        surfaceContainer.appendChild(modeSection);
      }

      /* 動態同步各數值 (對應目前 mode) */
      if (inputsMap[`_title`]) {
        inputsMap[`_title`].textContent = t("colors.surfaceOverride.system") || "系統";
      }

      const props = ["bg", "surface", "btnSecondaryBg", "btnInvertedBg", "text", "border"];
      props.forEach(prop => {
        const currentVal = currentColors.surface?.[prop];
        const el = inputsMap[prop];
        if (el) {
          if (el.labelEl) {
            el.labelEl.textContent = t(`colors.surface.${prop}`) || prop;
          }
          if (currentVal) {
            if (el.hexInput !== document.activeElement) {
              el.hexInput.value = currentVal.toLowerCase();
            }
            el.bubble.style.backgroundColor = currentVal;
            if (HEX_REGEX.test(currentVal)) {
              el.nativePicker.value = currentVal.toLowerCase();
            }
          }
        }
      });
    }
  };

  block.update(store.getState());
  return block;
}
