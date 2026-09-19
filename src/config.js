/* 應用程式全域常數與設定 */
export const APP_ORIGIN = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://localhost';
export const STORAGE_KEY = 'byds:state:v6';
export const SCHEMA_VERSION = 5;
