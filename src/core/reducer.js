/* 純函式 reducer，處理所有 Action（完全遵循 SPEC 第 5.3 節） */
import { ACTIONS } from "./actions.js";
import { defaultState } from "./defaultState.js";

/* 深拷貝物件輔助函式 */
function deepClone(obj) {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

/* 不可變路徑更新函式：依據點記法路徑沿途淺複製並設值 */
function setIn(obj, pathParts, value) {
  if (pathParts.length === 0) return value;
  const [head, ...tail] = pathParts;
  const current = obj && typeof obj === "object" ? obj : {};
  return {
    ...current,
    [head]: setIn(current[head], tail, value)
  };
}

export function reducer(state = defaultState, action) {
  if (!action || !action.type) return state;

  switch (action.type) {
    case ACTIONS.APPLY_PRESET: {
      const { presetId, presetState } = action.payload;
      if (!presetState) return state;
      /* 保留當前的 meta.locale 與整個 ui 狀態 */
      const nextState = deepClone(presetState);
      return {
        ...nextState,
        meta: {
          ...nextState.meta,
          presetId: presetId || "custom",
          locale: state.meta.locale,
          previewMode: state.meta.previewMode,
          contentLanguage: nextState.meta.contentLanguage || state.meta.contentLanguage
        },
        ui: {
          ...state.ui
        }
      };
    }

    case ACTIONS.SET_LOCALE: {
      return {
        ...state,
        meta: {
          ...state.meta,
          locale: action.payload.locale
        }
      };
    }

    case ACTIONS.SET_PREVIEW_MODE: {
      return {
        ...state,
        meta: {
          ...state.meta,
          previewMode: action.payload.mode
        }
      };
    }

    case ACTIONS.SET_TAB: {
      return {
        ...state,
        ui: {
          ...state.ui,
          activeTab: action.payload.tab
        }
      };
    }

    case ACTIONS.SET_PANEL_OPEN: {
      const { panel, open } = action.payload;
      const current = state.ui?.panels?.[panel] || { open: false, completed: false };
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [panel]: {
              ...current,
              open
            }
          }
        }
      };
    }

    case ACTIONS.SET_PANEL_COMPLETED: {
      const { panel, completed } = action.payload;
      const current = state.ui?.panels?.[panel] || { open: false, completed: false };
      /* SPEC 9.3.2: 點「完成」→ 自動收合；點「編輯」→ 自動展開 */
      return {
        ...state,
        ui: {
          ...state.ui,
          panels: {
            ...state.ui.panels,
            [panel]: {
              ...current,
              completed,
              open: !completed
            }
          }
        }
      };
    }

    case ACTIONS.SET_LEFT_WIDTH: {
      const clamped = Math.max(250, Math.min(560, Math.round(action.payload.width)));
      return {
        ...state,
        ui: {
          ...state.ui,
          leftPanelWidth: clamped
        }
      };
    }

    case ACTIONS.PATCH: {
      const { path, value } = action.payload;
      if (!path) return state;
      const parts = path.split(".");
      let nextState = setIn(state, parts, value);

      /* 若修改的是設計 token 參數（非 meta / ui），將 presetId 標記為 custom */
      if (parts[0] !== "ui" && parts[0] !== "meta") {
        if (nextState.meta.presetId !== "custom") {
          nextState = {
            ...nextState,
            meta: {
              ...nextState.meta,
              presetId: "custom"
            }
          };
        }
      }
      return nextState;
    }

    case ACTIONS.ADD_COLOR: {
      const { group } = action.payload;

      if (group === "primaries") {
        if (state.colors.light.primaries.length >= 3) return state;
        
        const existingIds = state.colors.light.primaries.map(c => c.id);
        const candidates = ["primary", "secondary", "tertiary"];
        let id = candidates.find(c => !existingIds.includes(c));
        if (!id) id = `primary-${Date.now()}`;

        return {
          ...state,
          meta: { ...state.meta, presetId: "custom" },
          colors: {
            ...state.colors,
            light: {
              ...state.colors.light,
              primaries: [...state.colors.light.primaries, { id, seed: "#000000" }]
            },
            dark: {
              ...state.colors.dark,
              primaries: [...state.colors.dark.primaries, { id, seed: "#FFFFFF" }]
            }
          }
        };
      } else if (group === "accents") {
        if (state.colors.light.accents.length >= 6) return state;
        const id = `accent-${Date.now()}`;
        return {
          ...state,
          meta: { ...state.meta, presetId: "custom" },
          colors: {
            ...state.colors,
            light: {
              ...state.colors.light,
              accents: [...state.colors.light.accents, { id, seed: "#000000" }]
            },
            dark: {
              ...state.colors.dark,
              accents: [...state.colors.dark.accents, { id, seed: "#FFFFFF" }]
            }
          }
        };
      }
      return state;
    }

    case ACTIONS.REMOVE_COLOR: {
      const { group, id } = action.payload;
      if (group === "primaries") {
        if (state.colors.light.primaries.length <= 1) return state;
        return {
          ...state,
          meta: { ...state.meta, presetId: "custom" },
          colors: {
            ...state.colors,
            light: {
              ...state.colors.light,
              primaries: state.colors.light.primaries.filter(c => c.id !== id)
            },
            dark: {
              ...state.colors.dark,
              primaries: state.colors.dark.primaries.filter(c => c.id !== id)
            }
          }
        };
      } else if (group === "accents") {
        return {
          ...state,
          meta: { ...state.meta, presetId: "custom" },
          colors: {
            ...state.colors,
            light: {
              ...state.colors.light,
              accents: state.colors.light.accents.filter(c => c.id !== id)
            },
            dark: {
              ...state.colors.dark,
              accents: state.colors.dark.accents.filter(c => c.id !== id)
            }
          }
        };
      }
      return state;
    }

    case ACTIONS.SET_TYPE_OVERRIDE: {
      const { step, prop, value } = action.payload;
      const currentOverrides = state.typography.overrides || {};
      const currentStep = currentOverrides[step] || {};
      return {
        ...state,
        meta: { ...state.meta, presetId: "custom" },
        typography: {
          ...state.typography,
          overrides: {
            ...currentOverrides,
            [step]: {
              ...currentStep,
              [prop]: value
            }
          }
        }
      };
    }

    case ACTIONS.CLEAR_TYPE_OVERRIDE: {
      const { step } = action.payload;
      const currentOverrides = { ...(state.typography.overrides || {}) };
      delete currentOverrides[step];
      return {
        ...state,
        meta: { ...state.meta, presetId: "custom" },
        typography: {
          ...state.typography,
          overrides: currentOverrides
        }
      };
    }

    case ACTIONS.RESET_ALL: {
      const fresh = deepClone(defaultState);
      return {
        ...fresh,
        meta: {
          ...fresh.meta,
          locale: state.meta.locale
        },
        ui: {
          ...fresh.ui,
          leftPanelWidth: state.ui.leftPanelWidth
        }
      };
    }

    case ACTIONS.HYDRATE: {
      const incoming = action.payload.state;
      if (!incoming) return state;
      /* 確保結構完整，合併 defaultState */
      return {
        ...defaultState,
        ...incoming,
        meta: {
          ...defaultState.meta,
          ...incoming.meta,
          /* 保留現有語言如果使用者沒在 hash 指定 */
          locale: incoming.meta?.locale || state.meta.locale
        },
        ui: {
          ...defaultState.ui,
          ...incoming.ui,
          /* 保留本機面板寬度 */
          leftPanelWidth: state.ui.leftPanelWidth
        }
      };
    }

    default:
      return state;
  }
}
