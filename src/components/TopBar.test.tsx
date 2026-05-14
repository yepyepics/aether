import { fireEvent, render } from "@solidjs/testing-library";
import { vi } from "vitest";
import { TopBar } from "./TopBar";

describe("TopBar", () => {
  it("renders app name", () => {
    const { getByText } = render(() => <TopBar />);
    expect(getByText("Aether")).toBeInTheDocument();
  });

  it("renders custom version prop", () => {
    const { getByText } = render(() => <TopBar version="v1.2.3" />);
    expect(getByText("v1.2.3")).toBeInTheDocument();
  });

  it("renders and handles leading action", () => {
    const onClick = vi.fn();
    const { getByRole } = render(() => (
      <TopBar leadingAction={{ label: "← Назад", ariaLabel: "Назад", onClick }} />
    ));

    fireEvent.click(getByRole("button", { name: "Назад" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders and handles trailing action", () => {
    const onClick = vi.fn();
    const { getByRole } = render(() => (
      <TopBar trailingAction={{ label: "⚙", ariaLabel: "Открыть настройки", onClick }} />
    ));

    fireEvent.click(getByRole("button", { name: "Открыть настройки" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
