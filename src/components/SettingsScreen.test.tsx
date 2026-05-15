import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { beforeEach, vi } from "vitest";
import { SettingsScreen } from "./SettingsScreen";
import { PENDING_CHANGELOG_STORAGE_KEY } from "../lib/pendingChangelog";
import { locale, t } from "../store/i18n";
import { resetNavigationForTests } from "../stores/navigationStore";
import { resetPreferencesForTests } from "../stores/preferencesStore";

describe("SettingsScreen", () => {
  beforeEach(() => {
    localStorage.clear();
    resetNavigationForTests();
    resetPreferencesForTests();
  });

  it("loads saved formats from localStorage on mount", async () => {
    localStorage.setItem("aether.defaultVideoFormat", "mkv");
    localStorage.setItem("aether.defaultAudioFormat", "m4a");

    const { getByLabelText } = render(() => <SettingsScreen />);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getByLabelText("Дефолтный формат видео")).toHaveValue("mkv");
    expect(getByLabelText("Дефолтный формат аудио")).toHaveValue("m4a");
  });

  it("persists changed formats immediately", () => {
    const { getByLabelText } = render(() => <SettingsScreen />);

    fireEvent.change(getByLabelText("Дефолтный формат видео"), {
      target: { value: "webm" },
    });
    fireEvent.change(getByLabelText("Дефолтный формат аудио"), {
      target: { value: "wav" },
    });

    expect(localStorage.getItem("aether.defaultVideoFormat")).toBe("webm");
    expect(localStorage.getItem("aether.defaultAudioFormat")).toBe("wav");
  });

  it("changes language immediately and persists it", () => {
    const { getByLabelText, getByText } = render(() => <SettingsScreen />);

    fireEvent.change(getByLabelText("Язык / Language"), {
      target: { value: "en" },
    });

    expect(locale()).toBe("en");
    expect(localStorage.getItem("app_lang")).toBe("en");
    expect(getByText("Settings")).toBeInTheDocument();
    expect(getByLabelText("Язык / Language")).toHaveValue("en");
    expect(t("btnDownload")).toBe("Download");
  });

  it("persists auto-update preference immediately", () => {
    const { getByRole } = render(() => <SettingsScreen />);

    fireEvent.click(getByRole("switch", { name: "Автоматически проверять обновления" }));

    expect(localStorage.getItem("aether.autoUpdateEnabled")).toBe("false");
  });

  it("shows current version and up-to-date state after manual check", async () => {
    vi.mocked(getVersion).mockResolvedValue("1.0.0-beta");
    vi.mocked(check).mockResolvedValue(null);

    const { getByText, getByRole } = render(() => <SettingsScreen />);

    await waitFor(() => {
      expect(getByText("1.0.0 Beta")).toBeInTheDocument();
    });

    fireEvent.click(getByRole("button", { name: "Проверить обновления" }));

    await waitFor(() => {
      expect(getByText("У вас установлена последняя версия")).toBeInTheDocument();
    });
  });

  it("offers install action when an update is available", async () => {
    const downloadAndInstall = vi.fn().mockResolvedValue(undefined);

    vi.mocked(check).mockResolvedValue({
      version: "0.2.0",
      body: "- Улучшен updater",
      downloadAndInstall,
    } as unknown as Awaited<ReturnType<typeof check>>);

    const { getByRole, getByText } = render(() => <SettingsScreen />);

    fireEvent.click(getByRole("button", { name: "Проверить обновления" }));

    await waitFor(() => {
      expect(getByText("Доступна версия v0.2.0")).toBeInTheDocument();
    });

    fireEvent.click(getByRole("button", { name: "Установить и перезапустить" }));

    await waitFor(() => {
      expect(downloadAndInstall).toHaveBeenCalledTimes(1);
      expect(relaunch).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem(PENDING_CHANGELOG_STORAGE_KEY)).toContain("\"version\":\"0.2.0\"");
    });
  });
});
