const DEFAULT_LOCALE = "nb-NO";
const STORAGE_KEY = "ordenLocale";

let activeLocale = DEFAULT_LOCALE;
let fallbackMessages = {};
let activeMessages = {};
let localeManifest = [];

async function loadFile(locale) {
  const response = await fetch(`/orden/locales/${encodeURIComponent(locale)}.json`, { cache: "no-cache" });
  if (!response.ok) throw new Error(`locale_load_failed:${locale}`);
  return response.json();
}

function interpolate(message, variables) {
  return String(message).replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

export async function initI18n(preferredLocale) {
  const manifestResponse = await fetch("/orden/locales/manifest.json", { cache: "no-cache" });
  localeManifest = manifestResponse.ok ? await manifestResponse.json() : [{ code: DEFAULT_LOCALE, name: DEFAULT_LOCALE }];
  fallbackMessages = await loadFile(DEFAULT_LOCALE);
  const stored = preferredLocale || localStorage.getItem(STORAGE_KEY);
  const requested = localeManifest.some(({ code }) => code === stored) ? stored : DEFAULT_LOCALE;
  activeMessages = requested === DEFAULT_LOCALE ? fallbackMessages : await loadFile(requested).catch(() => fallbackMessages);
  activeLocale = activeMessages["_meta.code"] || DEFAULT_LOCALE;
  localStorage.setItem(STORAGE_KEY, activeLocale);
  applyDocumentLocale();
  return activeLocale;
}

export async function setLocale(locale) {
  if (!localeManifest.some(({ code }) => code === locale)) locale = DEFAULT_LOCALE;
  activeMessages = locale === DEFAULT_LOCALE ? fallbackMessages : await loadFile(locale).catch(() => fallbackMessages);
  activeLocale = activeMessages["_meta.code"] || DEFAULT_LOCALE;
  localStorage.setItem(STORAGE_KEY, activeLocale);
  applyDocumentLocale();
  return activeLocale;
}

export function t(key, variables = {}) {
  return interpolate(activeMessages[key] ?? fallbackMessages[key] ?? key, variables);
}

export function getLocale() {
  return activeLocale;
}

export function getLocales() {
  return localeManifest.map((locale) => ({ ...locale }));
}

export function formatDate(value, options = {}) {
  return new Intl.DateTimeFormat(activeLocale, { dateStyle: "medium", ...options }).format(new Date(value));
}

export function formatTime(value, options = {}) {
  return new Intl.DateTimeFormat(activeLocale, { hour: "2-digit", minute: "2-digit", hour12: false, ...options }).format(new Date(value));
}

export function formatDateTime(value, options = {}) {
  return new Intl.DateTimeFormat(activeLocale, { dateStyle: "medium", timeStyle: "short", hour12: false, ...options }).format(new Date(value));
}

function applyDocumentLocale() {
  document.documentElement.lang = activeLocale;
  document.title = t("app.title");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("app.description"));
}
