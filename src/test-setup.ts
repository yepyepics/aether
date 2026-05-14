import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";
import { resetI18nForTests } from "./store/i18n";

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  localStorage.clear();
  resetI18nForTests();
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: "ru-RU",
  });
  Object.defineProperty(window.navigator, "languages", {
    configurable: true,
    value: ["ru-RU"],
  });
});
