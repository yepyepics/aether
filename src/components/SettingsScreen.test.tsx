import { fireEvent, render } from "@solidjs/testing-library";
import { beforeEach } from "vitest";
import { SettingsScreen } from "./SettingsScreen";
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
});
