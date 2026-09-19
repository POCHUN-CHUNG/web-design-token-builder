import { GOOGLE_FONTS_DATA } from "../data/googleFontsData.js";

/* 所有 Google Fonts（共 1,946 款，依 A-Z 升冪排序） */
export const ALL_FONTS = GOOGLE_FONTS_DATA.allFonts;

/* Google Fonts 中文字型清單（共 32 款，依 A-Z 升冪排序） */
export const CJK_FONTS = GOOGLE_FONTS_DATA.cjkFonts;

/* 保留相容性匯出 */
export const CURATED_FONTS = ALL_FONTS.map(f => ({ family: f }));

