import { createSignal } from "solid-js";
import { en } from "../locales/en";
import { ru } from "../locales/ru";

export type Locale = "ru" | "en";
export type TranslationKey = keyof typeof ru;

const LANGUAGE_STORAGE_KEY = "app_lang";
const dictionaries = { ru, en } as const;

function resolveLocale(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

function isLocale(value: string | null): value is Locale {
  return value === "ru" || value === "en";
}

function readStoredLocale() {
  if (typeof window === "undefined") return null;
  const storedLocale = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return isLocale(storedLocale) ? storedLocale : null;
}

function detectSystemLanguage() {
  if (typeof navigator === "undefined") return "ru";
  return navigator.languages?.[0] ?? navigator.language ?? "ru";
}

function getInitialLocale(): Locale {
  return readStoredLocale() ?? resolveLocale(detectSystemLanguage());
}

function persistLocale(nextLocale: Locale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
}

const [localeSignal, setLocaleSignal] = createSignal<Locale>(getInitialLocale());

export const locale = localeSignal;

export function changeLanguage(nextLocale: Locale) {
  setLocaleSignal(nextLocale);
  persistLocale(nextLocale);
}

export function setLocale(nextLocale: Locale) {
  changeLanguage(nextLocale);
}

export function t(key: TranslationKey) {
  return dictionaries[localeSignal()][key];
}

export function initializeI18n() {
  setLocaleSignal(getInitialLocale());
}

export function resetI18nForTests() {
  setLocaleSignal("ru");
}
