import "@testing-library/jest-dom";
import { beforeEach, vi } from "vitest";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { resetUpdaterForTests } from "./hooks/useUpdater";
import { resetI18nForTests } from "./store/i18n";

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: vi.fn().mockResolvedValue("1.0.0-beta"),
}));

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: vi.fn().mockResolvedValue(null),
}));

vi.mock("@tauri-apps/plugin-process", () => ({
  relaunch: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  resetI18nForTests();
  resetUpdaterForTests();
  vi.mocked(getVersion).mockResolvedValue("1.0.0-beta");
  vi.mocked(check).mockResolvedValue(null);
  vi.mocked(relaunch).mockResolvedValue(undefined);
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: "ru-RU",
  });
  Object.defineProperty(window.navigator, "languages", {
    configurable: true,
    value: ["ru-RU"],
  });
});
