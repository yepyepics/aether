import { render, fireEvent } from "@solidjs/testing-library";
import { beforeEach, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { MainScreen } from "./MainScreen";
import { currentView, resetNavigationForTests } from "../stores/navigationStore";
import { resetPreferencesForTests } from "../stores/preferencesStore";

describe("MainScreen", () => {
  beforeEach(() => {
    localStorage.clear();
    resetNavigationForTests();
    resetPreferencesForTests();
    vi.mocked(invoke).mockClear();
  });

  it("renders URL input", () => {
    const { getByPlaceholderText } = render(() => <MainScreen />);
    expect(getByPlaceholderText("Вставьте ссылку на видео…")).toBeInTheDocument();
  });

  it("opens settings screen from header button", () => {
    const { getByRole } = render(() => <MainScreen />);
    fireEvent.click(getByRole("button", { name: "Открыть настройки" }));
    expect(currentView()).toBe("settings");
  });

  it("Download button is disabled when URL is empty", () => {
    const { getByRole } = render(() => <MainScreen />);
    expect(getByRole("button", { name: "Скачать" })).toBeDisabled();
  });

  it("Download button enables after URL is typed", () => {
    const { getByPlaceholderText, getByRole } = render(() => <MainScreen />);
    fireEvent.input(getByPlaceholderText("Вставьте ссылку на видео…"), {
      target: { value: "https://youtube.com/watch?v=abc" },
    });
    expect(getByRole("button", { name: "Скачать" })).not.toBeDisabled();
  });

  it("hides Quality row when Аудио is selected", () => {
    const { getByText, queryByText } = render(() => <MainScreen />);
    fireEvent.click(getByText("Аудио"));
    expect(queryByText("1080p")).not.toBeInTheDocument();
  });

  it("shows ProgressCard and hides DownloadButton when downloading", () => {
    const { getByPlaceholderText, getByRole, getByText, queryByRole } = render(() => <MainScreen />);
    fireEvent.input(getByPlaceholderText("Вставьте ссылку на видео…"), {
      target: { value: "https://youtube.com" },
    });
    fireEvent.click(getByRole("button", { name: "Скачать" }));
    expect(getByText("Загрузка…")).toBeInTheDocument();
    expect(queryByRole("button", { name: "Скачать" })).not.toBeInTheDocument();
  });

  it("returns to idle after Отменить is clicked", () => {
    const { getByPlaceholderText, getByRole, queryByText } = render(() => <MainScreen />);
    fireEvent.input(getByPlaceholderText("Вставьте ссылку на видео…"), {
      target: { value: "https://youtube.com" },
    });
    fireEvent.click(getByRole("button", { name: "Скачать" }));
    fireEvent.click(getByRole("button", { name: "Отменить" }));
    expect(queryByText("Загрузка…")).not.toBeInTheDocument();
    expect(getByRole("button", { name: "Скачать" })).toBeInTheDocument();
  });

  it("renders SponsorBlock toggle unchecked by default", () => {
    const { getByRole } = render(() => <MainScreen />);
    const toggle = getByRole("switch", { name: /вырезать/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("toggles SponsorBlock on click", () => {
    const { getByRole } = render(() => <MainScreen />);
    const toggle = getByRole("switch", { name: /вырезать/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("SponsorBlock toggle is disabled while downloading", () => {
    const { getByPlaceholderText, getByRole } = render(() => <MainScreen />);
    fireEvent.input(getByPlaceholderText("Вставьте ссылку на видео…"), {
      target: { value: "https://youtube.com/watch?v=test" },
    });
    fireEvent.click(getByRole("button", { name: "Скачать" }));
    const toggle = getByRole("switch", { name: /вырезать/i });
    expect(toggle).toBeDisabled();
  });

  it("renders Eco toggle inactive by default", () => {
    const { getByRole } = render(() => <MainScreen />);
    const toggle = getByRole("button", { name: "Eco mode" });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("title", "Eco-mode (лимит 5 МБ/с)");
  });

  it("toggles Eco mode on click", () => {
    const { getByRole } = render(() => <MainScreen />);
    const toggle = getByRole("button", { name: "Eco mode" });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("passes sponsorblock and saved formats to invoke", async () => {
    localStorage.setItem("aether.defaultVideoFormat", "webm");
    localStorage.setItem("aether.defaultAudioFormat", "wav");

    const { getByPlaceholderText, getByRole } = render(() => <MainScreen />);
    fireEvent.click(getByRole("switch", { name: /вырезать/i }));
    fireEvent.click(getByRole("button", { name: "Eco mode" }));
    fireEvent.input(getByPlaceholderText("Вставьте ссылку на видео…"), {
      target: { value: "https://youtube.com/watch?v=test" },
    });
    fireEvent.click(getByRole("button", { name: "Скачать" }));
    // Wait for async invoke call to complete
    await new Promise(r => setTimeout(r, 0));
    expect(invoke).toHaveBeenCalledWith("start_download", expect.objectContaining({
      sponsorblock: true,
      ecoMode: true,
      videoFormat: "webm",
      audioFormat: "wav",
    }));
  });
});
