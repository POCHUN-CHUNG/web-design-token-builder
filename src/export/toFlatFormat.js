/**
 * Phase 2 規格預留：DTCG 巢狀格式 → Stitch 扁平格式轉換器（完全遵循 SPEC 第 11.5 節）
 * 
 * 格式對應範例：
 * { color: { primary: { 500: { $value: "#2563eb" } } } }
 * → { colors: { "primary-500": "#2563eb" } }
 * 
 * MVP 階段確保資料結構可無損降階，函式規格預留於此
 */
export function toFlatFormat(dtcg) {
  /* Phase 2 實作預留 */
  return dtcg;
}
