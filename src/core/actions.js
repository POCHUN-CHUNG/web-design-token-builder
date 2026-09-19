/* Action 常數與 Action 建構函式（完全遵循 SPEC 第 5.3 節） */
export const ACTIONS = {
  APPLY_PRESET: "APPLY_PRESET",
  SET_LOCALE: "SET_LOCALE",
  SET_PREVIEW_MODE: "SET_PREVIEW_MODE",
  SET_TAB: "SET_TAB",
  SET_PANEL_OPEN: "SET_PANEL_OPEN",
  SET_PANEL_COMPLETED: "SET_PANEL_COMPLETED",
  SET_LEFT_WIDTH: "SET_LEFT_WIDTH",
  PATCH: "PATCH",
  ADD_COLOR: "ADD_COLOR",
  REMOVE_COLOR: "REMOVE_COLOR",
  ADD_GUIDELINE: "ADD_GUIDELINE",
  REMOVE_GUIDELINE: "REMOVE_GUIDELINE",
  SET_TYPE_OVERRIDE: "SET_TYPE_OVERRIDE",
  CLEAR_TYPE_OVERRIDE: "CLEAR_TYPE_OVERRIDE",
  RESET_ALL: "RESET_ALL",
  HYDRATE: "HYDRATE"
};

export const applyPreset = (presetId, presetState) => ({
  type: ACTIONS.APPLY_PRESET,
  payload: { presetId, presetState }
});

export const setLocale = (locale) => ({
  type: ACTIONS.SET_LOCALE,
  payload: { locale }
});

export const setPreviewMode = (mode) => ({
  type: ACTIONS.SET_PREVIEW_MODE,
  payload: { mode }
});

export const setTab = (tab) => ({
  type: ACTIONS.SET_TAB,
  payload: { tab }
});

export const setPanelOpen = (panel, open) => ({
  type: ACTIONS.SET_PANEL_OPEN,
  payload: { panel, open }
});

export const setPanelCompleted = (panel, completed) => ({
  type: ACTIONS.SET_PANEL_COMPLETED,
  payload: { panel, completed }
});

export const setLeftWidth = (width) => ({
  type: ACTIONS.SET_LEFT_WIDTH,
  payload: { width }
});

export const patch = (path, value) => ({
  type: ACTIONS.PATCH,
  payload: { path, value }
});

export const addColor = (group) => ({
  type: ACTIONS.ADD_COLOR,
  payload: { group }
});

export const removeColor = (group, id) => ({
  type: ACTIONS.REMOVE_COLOR,
  payload: { group, id }
});

export const addGuideline = (kind) => ({
  type: ACTIONS.ADD_GUIDELINE,
  payload: { kind }
});

export const removeGuideline = (kind, index) => ({
  type: ACTIONS.REMOVE_GUIDELINE,
  payload: { kind, index }
});

export const setTypeOverride = (step, prop, value) => ({
  type: ACTIONS.SET_TYPE_OVERRIDE,
  payload: { step, prop, value }
});

export const clearTypeOverride = (step) => ({
  type: ACTIONS.CLEAR_TYPE_OVERRIDE,
  payload: { step }
});

export const resetAll = () => ({
  type: ACTIONS.RESET_ALL,
  payload: {}
});

export const hydrate = (state) => ({
  type: ACTIONS.HYDRATE,
  payload: { state }
});
