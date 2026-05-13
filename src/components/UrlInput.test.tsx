import { render, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { UrlInput } from "./UrlInput";

describe("UrlInput", () => {
  it("renders placeholder", () => {
    const { getByPlaceholderText } = render(() => (
      <UrlInput value="" onChange={() => {}} />
    ));
    expect(getByPlaceholderText("Вставьте ссылку на видео…")).toBeInTheDocument();
  });

  it("calls onChange on text input", () => {
    const [val, setVal] = createSignal("");
    const { getByPlaceholderText } = render(() => (
      <UrlInput value={val()} onChange={setVal} />
    ));
    const input = getByPlaceholderText("Вставьте ссылку на видео…");
    fireEvent.input(input, { target: { value: "https://youtube.com" } });
    expect(val()).toBe("https://youtube.com");
  });

  it("renders Вставить button", () => {
    const { getByText } = render(() => (
      <UrlInput value="" onChange={() => {}} />
    ));
    expect(getByText("Вставить")).toBeInTheDocument();
  });
});
