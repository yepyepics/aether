import { describe, expect, it } from "vitest";
import { changeLanguage, initializeI18n, locale, t } from "./i18n";

describe("i18n", () => {
  it("uses Russian by default", () => {
    initializeI18n();
    expect(locale()).toBe("ru");
    expect(t("btnDownload")).toBe("Скачать");
  });

  it("uses English when system language is not Russian and storage is empty", () => {
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "en-US",
    });
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["en-US"],
    });

    initializeI18n();

    expect(locale()).toBe("en");
    expect(t("btnDownload")).toBe("Download");
  });

  it("prefers saved language from localStorage", () => {
    localStorage.setItem("app_lang", "ru");
    Object.defineProperty(window.navigator, "language", {
      configurable: true,
      value: "en-US",
    });
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["en-US"],
    });

    initializeI18n();

    expect(locale()).toBe("ru");
    expect(t("btnDownload")).toBe("Скачать");
  });

  it("persists language changes", () => {
    changeLanguage("en");

    expect(locale()).toBe("en");
    expect(localStorage.getItem("app_lang")).toBe("en");
  });
});
