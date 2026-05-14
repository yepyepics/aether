import { fireEvent, render } from "@solidjs/testing-library";
import { beforeEach } from "vitest";
import App from "./App";
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
});
