/* 設定區塊 5：元件與外觀 (陰影風格、邊框、圓角與內距整合) */
import { createPanelBlock } from "./panelBase.js";
import { patch } from "../core/actions.js";
import { t } from "../i18n/index.js";

const STRATEGY_LEVELS = {
  flat: {
    "level-1": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
    "level-2": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
    "level-3": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
    "level-4": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 },
    "level-5": { offsetX: 0, offsetY: 0, blur: 0, spread: 0, opacity: 0 }
  },
  soft: {
    "level-1": { offsetX: 0, offsetY: 2, blur: 8, spread: 0, opacity: 0.08 },
    "level-2": { offsetX: 0, offsetY: 6, blur: 18, spread: 0, opacity: 0.10 },
    "level-3": { offsetX: 0, offsetY: 16, blur: 36, spread: 0, opacity: 0.14 },
    "level-4": { offsetX: 0, offsetY: 24, blur: 48, spread: 0, opacity: 0.18 },
    "level-5": { offsetX: 0, offsetY: 32, blur: 64, spread: 0, opacity: 0.22 }
  },
  crisp: {
    "level-1": { offsetX: 0, offsetY: 2, blur: 4, spread: 0, opacity: 0.18 },
    "level-2": { offsetX: 0, offsetY: 5, blur: 12, spread: 0, opacity: 0.24 },
    "level-3": { offsetX: 0, offsetY: 12, blur: 24, spread: 0, opacity: 0.32 },
    "level-4": { offsetX: 0, offsetY: 18, blur: 32, spread: 0, opacity: 0.38 },
    "level-5": { offsetX: 0, offsetY: 24, blur: 40, spread: 0, opacity: 0.44 }
  }
};

export function createElevationShapePanel(store) {
  let stratLbl, stratSelect;
  let borderLbl, borderSlider, borderValText, borderLblText;
  let borderSubcardLblText, borderSubcardValText, borderSubcardSlider;
  let btnRadSlider, btnRadValText, btnRadLbl;
  let inputRadSlider, inputRadValText, inputRadLbl;
  let cardRadSlider, cardRadValText, cardRadLbl;
  let subcardRadSlider, subcardRadValText, subcardRadLbl;
  let checkRadLbl, checkRadValText, checkRadSlider;
  let sliderRadLbl, sliderRadValText, sliderRadSlider;
  let radiusSectionHeader;

  let cardPadLbl, cardPadValText, cardPadSlider;
  let subcardPadLbl, subcardPadValText, subcardPadSlider;
  let paddingSectionHeader;

  const stratOptions = [];

  function createSeparator(container) {
    const div = document.createElement("div");
    div.style.borderTop = "1px solid var(--app-border)";
    div.style.margin = "10px 0 8px";
    container.appendChild(div);
  }

  function createSectionHeader(titleText) {
    const h = document.createElement("div");
    h.style.fontSize = "12px";
    h.style.fontWeight = "600";
    h.style.color = "var(--app-text-muted)";
    h.style.marginTop = "12px";
    h.style.marginBottom = "4px";
    h.textContent = titleText;
    return h;
  }

  function createSliderRow({ labelText, min, max, step = 1, defaultVal, onInput }) {
    const row = document.createElement("div");
    row.className = "ctrl-row";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    const lbl = document.createElement("label");
    lbl.className = "ctrl-label";
    lbl.textContent = labelText;

    const valText = document.createElement("span");
    valText.style.fontSize = "12px";
    valText.style.color = "var(--app-text-muted)";
    valText.textContent = `${defaultVal}`;

    header.appendChild(lbl);
    header.appendChild(valText);
    row.appendChild(header);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "ctrl-slider";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = defaultVal;
    slider.style.width = "100%";
    slider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      valText.textContent = `${val}`;
      onInput(val);
    });

    row.appendChild(slider);
    return { row, lbl, valText, slider };
  }

  const block = createPanelBlock({
    id: "elevation",
    titleKey: "panel.elevation.title",
    store,
    renderContent(container, store) {
      /* 1. 陰影風格 (已刪除) */

      /**
       * 2. 邊框寬度
       * 1. 邊框 (px)
       */
      borderLbl = createSectionHeader(t("shape.borderWidth") || "邊框（像素）");
      container.appendChild(borderLbl);

      const borderRow = createSliderRow({
        labelText: t("components.card") || "Card",
        min: 0,
        max: 10,
        step: 1,
        defaultVal: 1,
        onInput: (val) => {
          store.dispatch(patch("shape.borderWidth", val));
          store.dispatch(patch("shape.borderStrategy", val === 0 ? "none" : (val >= 2 ? "bold" : "hairline")));
        }
      });
      /* 需要變數來儲存標籤與滑桿，以便後續更新數值 */
      borderLblText = borderRow.lbl;
      borderValText = borderRow.valText;
      borderSlider = borderRow.slider;
      container.appendChild(borderRow.row);

      const subcardBorderRow = createSliderRow({
        labelText: t("components.subcard") || "Subcard",
        min: 0,
        max: 10,
        step: 1,
        defaultVal: 1,
        onInput: (val) => {
          store.dispatch(patch("shape.subcardBorderWidth", val));
        }
      });
      borderSubcardLblText = subcardBorderRow.lbl;
      borderSubcardValText = subcardBorderRow.valText;
      borderSubcardSlider = subcardBorderRow.slider;
      container.appendChild(subcardBorderRow.row);

      createSeparator(container);

      /* ── 3. 圓角（像素）區塊 ── */
      radiusSectionHeader = createSectionHeader(t("components.radiusHierarchy") || "圓角（像素）");
      container.appendChild(radiusSectionHeader);

      (() => {
        const r = createSliderRow({
          labelText: t("components.card") || "卡片",
          min: 0, max: 80, defaultVal: 12,
          onInput: (val) => store.dispatch(patch("components.card.radius", val))
        });
        cardRadLbl = r.lbl; cardRadValText = r.valText; cardRadSlider = r.slider;
        container.appendChild(r.row);
      })();

      (() => {
        const r = createSliderRow({
          labelText: t("components.subcard") || "子卡片",
          min: 0, max: 50, defaultVal: 8,
          onInput: (val) => store.dispatch(patch("components.subcard.radius", val))
        });
        subcardRadLbl = r.lbl; subcardRadValText = r.valText; subcardRadSlider = r.slider;
        container.appendChild(r.row);
      })();

      (() => {
        const r = createSliderRow({
          labelText: t("components.button") || "按鈕",
          min: 0, max: 25, defaultVal: 8,
          onInput: (val) => store.dispatch(patch("components.button.radius", val))
        });
        btnRadLbl = r.lbl; btnRadValText = r.valText; btnRadSlider = r.slider;
        container.appendChild(r.row);
      })();

      (() => {
        const r = createSliderRow({
          labelText: t("components.input") || "輸入框",
          min: 0, max: 30, defaultVal: 8,
          onInput: (val) => store.dispatch(patch("components.input.radius", val))
        });
        inputRadLbl = r.lbl; inputRadValText = r.valText; inputRadSlider = r.slider;
        container.appendChild(r.row);
      })();

      (() => {
        const r = createSliderRow({
          labelText: t("components.controls") || "控制項",
          min: 0, max: 15, defaultVal: 4,
          onInput: (val) => store.dispatch(patch("components.checkboxRadio.radius", val))
        });
        checkRadLbl = r.lbl; checkRadValText = r.valText; checkRadSlider = r.slider;
        container.appendChild(r.row);
      })();

      createSeparator(container);

      /* ── 4. 內距（像素）區塊 ── */
      paddingSectionHeader = createSectionHeader(t("components.paddingSection") || "內距（像素）");
      container.appendChild(paddingSectionHeader);

      (() => {
        const r = createSliderRow({
          labelText: t("components.cardPadding") || "卡片",
          min: 0, max: 50, defaultVal: 16,
          onInput: (val) => store.dispatch(patch("components.card.padding", val))
        });
        cardPadLbl = r.lbl; cardPadValText = r.valText; cardPadSlider = r.slider;
        container.appendChild(r.row);
      })();

      (() => {
        const r = createSliderRow({
          labelText: t("components.subcardPadding") || "子卡片",
          min: 0, max: 40, defaultVal: 12,
          onInput: (val) => store.dispatch(patch("components.subcard.padding", val))
        });
        subcardPadLbl = r.lbl; subcardPadValText = r.valText; subcardPadSlider = r.slider;
        container.appendChild(r.row);
      })();
    }
  });

  const originalUpdate = block.update;
  block.update = function (state) {
    originalUpdate(state);
    if (stratLbl) stratLbl.textContent = t("elevation.strategy") || "陰影風格";
    if (borderLbl) borderLbl.textContent = t("shape.borderWidth") || "邊框（像素）";
    if (borderLblText) borderLblText.textContent = t("components.card") || "Card";

    if (borderSubcardLblText) borderSubcardLblText.textContent = t("components.subcard") || "Subcard";

    if (stratOptions) {
      stratOptions.forEach(item => {
        item.opt.textContent = t(`elevation.strategy.${item.val}`) || item.label;
      });
    }

    if (radiusSectionHeader) radiusSectionHeader.textContent = t("components.radiusHierarchy") || "圓角（像素）";
    if (paddingSectionHeader) paddingSectionHeader.textContent = t("components.paddingSection") || "內距（像素）";

    if (cardRadLbl)    cardRadLbl.textContent    = t("components.card")     || "卡片";
    if (subcardRadLbl) subcardRadLbl.textContent = t("components.subcard")  || "子卡片";
    if (btnRadLbl)     btnRadLbl.textContent     = t("components.button")   || "按鈕";
    if (inputRadLbl)   inputRadLbl.textContent   = t("components.input")    || "輸入框";
    if (checkRadLbl)   checkRadLbl.textContent   = t("components.controls") || "控制項";
    if (sliderRadLbl)  sliderRadLbl.textContent  = t("components.slider")   || "Slider";

    if (cardPadLbl)    cardPadLbl.textContent    = t("components.cardPadding")    || "卡片";
    if (subcardPadLbl) subcardPadLbl.textContent = t("components.subcardPadding") || "子卡片";

    const { elevation, shape, components = {} } = state;
    if (stratSelect) {
      stratSelect.value = elevation.strategy || "crisp";
    }
    if (borderSlider) {
      const bw = shape.borderWidth ?? (shape.borderStrategy === "none" ? 0 : 1);
      borderSlider.value = bw;
      if (borderValText) borderValText.textContent = `${bw}`;
    }
    if (borderSubcardSlider) {
      const sbw = shape.subcardBorderWidth ?? 1;
      borderSubcardSlider.value = sbw;
      if (borderSubcardValText) borderSubcardValText.textContent = `${sbw}`;
    }

    const cardRad = typeof components.card?.radius === "number" ? components.card.radius : 12;
    if (cardRadSlider) { cardRadSlider.value = cardRad; if (cardRadValText) cardRadValText.textContent = `${cardRad}`; }

    const subcardRad = typeof components.subcard?.radius === "number" ? components.subcard.radius : 8;
    if (subcardRadSlider) { subcardRadSlider.value = subcardRad; if (subcardRadValText) subcardRadValText.textContent = `${subcardRad}`; }

    const btnRad = typeof components.button?.radius === "number" ? components.button.radius : 8;
    if (btnRadSlider) { btnRadSlider.value = btnRad; if (btnRadValText) btnRadValText.textContent = `${btnRad}`; }

    const inputRad = typeof components.input?.radius === "number" ? components.input.radius : 8;
    if (inputRadSlider) { inputRadSlider.value = inputRad; if (inputRadValText) inputRadValText.textContent = `${inputRad}`; }

    const checkRad = typeof components.checkboxRadio?.radius === "number" ? components.checkboxRadio.radius : 4;
    if (checkRadSlider) { checkRadSlider.value = checkRad; if (checkRadValText) checkRadValText.textContent = `${checkRad}`; }

    const cardPad = typeof components.card?.padding === "number" ? components.card.padding : 16;
    if (cardPadSlider) { cardPadSlider.value = cardPad; if (cardPadValText) cardPadValText.textContent = `${cardPad}`; }

    const subcardPad = typeof components.subcard?.padding === "number" ? components.subcard.padding : 12;
    if (subcardPadSlider) { subcardPadSlider.value = subcardPad; if (subcardPadValText) subcardPadValText.textContent = `${subcardPad}`; }
  };

  block.update(store.getState());
  return block;
}
