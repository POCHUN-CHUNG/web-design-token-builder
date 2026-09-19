/* 排程與節流工具（完全遵循 SPEC 第 3.1 & 3.2 節） */

/* requestAnimationFrame 合併排程器 */
export function createRafBatcher(fn) {
  let scheduled = false;
  let lastArgs = null;

  return function (...args) {
    lastArgs = args;
    if (!scheduled) {
      scheduled = true;
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(() => {
          scheduled = false;
          fn(...lastArgs);
        });
      } else {
        setTimeout(() => {
          scheduled = false;
          fn(...lastArgs);
        }, 16);
      }
    }
  };
}

/* 防抖函式 (Debounce) */
export function debounce(fn, wait) {
  let timeoutId = null;
  return function (...args) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn.apply(this, args);
    }, wait);
  };
}

/* 節流函式 (Throttle) */
export function throttle(fn, limit) {
  let inThrottle = false;
  let lastArgs = null;
  let lastContext = null;

  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          fn.apply(lastContext, lastArgs);
          lastArgs = null;
          lastContext = null;
        }
      }, limit);
    } else {
      lastArgs = args;
      lastContext = this;
    }
  };
}

/* requestIdleCallback 降級包裝 */
export function scheduleIdle(fn) {
  if (typeof requestIdleCallback !== "undefined") {
    return requestIdleCallback(fn);
  }
  return setTimeout(() => fn({ didTimeout: false, timeRemaining: () => 10 }), 1);
}
