import { fireEvent, render } from "@solidjs/testing-library";
import { beforeEach } from "vitest";
import { check } from "@tauri-apps/plugin-updater";
import App from "./App";
import { PENDING_CHANGELOG_STORAGE_KEY } from "./lib/pendingChangelog";
import { resetNavigationForTests } from "./stores/navigationStore";
import { resetPreferencesForTests } from "./stores/preferencesStore";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    resetNavigationForTests();
    resetPreferencesForTests();
  });

  it("switches between home and settings views", () => {
    const { getByRole, getByText, getByPlaceholderText } = render(() => <App />);

    fireEvent.click(getByRole("button", { name: "Открыть настройки" }));
    expect(getByText("Настройки")).toBeInTheDocument();

    fireEvent.click(getByRole("button", { name: "Вернуться на главный экран" }));
    expect(getByPlaceholderText("Вставьте ссылку на видео…")).toBeInTheDocument();
  });

  it("shows the pending changelog once after launch", () => {
    localStorage.setItem(
      PENDING_CHANGELOG_STORAGE_KEY,
      JSON.stringify({
        version: "0.2.0",
        notes: "- Улучшен автоапдейт\n- Исправлены мелкие баги",
      })
    );

    const { getByRole, getByText, queryByRole } = render(() => <App />);

    expect(
      getByRole("heading", { name: "Обновлено до версии v0.2.0" })
    ).toBeInTheDocument();
    const notes = getByText(/Улучшен автоапдейт/);
    expect(notes).toHaveClass("whitespace-pre-wrap");
    expect(notes).toHaveTextContent("Улучшен автоапдейт");
    expect(notes).toHaveTextContent("Исправлены мелкие баги");
    expect(localStorage.getItem(PENDING_CHANGELOG_STORAGE_KEY)).toBeNull();

    fireEvent.click(getByRole("button", { name: "Отлично, поехали!" }));

    expect(
      queryByRole("heading", { name: "Обновлено до версии v0.2.0" })
    ).not.toBeInTheDocument();
  });

  it("skips startup update check when auto-update is disabled", () => {
    localStorage.setItem("aether.autoUpdateEnabled", "false");

    render(() => <App />);

    expect(check).not.toHaveBeenCalled();
  });
});
