/* 集中式狀態 Store 實作（完全遵循 SPEC 第 4 節 & 第 3.3 節） */
export function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = new Set();
  let isDispatching = false;

  function getState() {
    return state;
  }

  function dispatch(action) {
    if (typeof action !== "object" || action === null || typeof action.type === "undefined") {
      throw new Error("Actions must be plain objects with a type property.");
    }
    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions.");
    }

    try {
      isDispatching = true;
      state = reducer(state, action);
    } finally {
      isDispatching = false;
    }

    listeners.forEach(listener => {
      try {
        listener(state, action);
      } catch (err) {
        console.error("Error in store listener:", err);
      }
    });

    return action;
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error("Expected the listener to be a function.");
    }
    listeners.add(listener);
    return function unsubscribe() {
      listeners.delete(listener);
    };
  }

  return {
    getState,
    dispatch,
    subscribe
  };
}
