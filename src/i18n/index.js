/* 國際化模組進入點（完全遵循 SPEC 第 12 節） */
import { zhTW } from "./zh-TW.js";
import { en } from "./en.js";

let currentLocale = "zh-TW";
let dict = zhTW;

export function setLocale(locale) {
  currentLocale = locale;
  if (locale === "en") {
    dict = en;
  } else if (locale === "all") {
    dict = null;
  } else {
    currentLocale = "zh-TW";
    dict = zhTW;
  }
}

export function getLocale() {
  return currentLocale;
}

export function t(key, vars = {}) {
  let str;
  if (currentLocale === "all") {
    const zhVal = zhTW[key] || key;
    const enVal = en[key] || key;
    str = zhVal === enVal ? zhVal : `${zhVal} / ${enVal}`;
  } else {
    str = (dict ? dict[key] : null) || zhTW[key] || key;
  }
  if (vars && typeof vars === "object") {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return str;
}
