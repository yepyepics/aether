import { render, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { PillGroup } from "./PillGroup";
import { describe, it, expect, vi } from "vitest";

const FORMAT_OPTIONS = [
  { value: "video" as const, label: "Видео" },
  { value: "audio" as const, label: "Аудио" },
];

describe("PillGroup", () => {
  it("renders all options", () => {
    const { getByText } = render(() => (
      <PillGroup options={FORMAT_OPTIONS} value="video" onChange={() => {}} />
    ));
    expect(getByText("Видео")).toBeInTheDocument();
    expect(getByText("Аудио")).toBeInTheDocument();
  });

  it("calls onChange when inactive pill clicked", () => {
    const [val, setVal] = createSignal<"video" | "audio">("video");
    const { getByText } = render(() => (
      <PillGroup options={FORMAT_OPTIONS} value={val()} onChange={setVal} />
    ));
    fireEvent.click(getByText("Аудио"));
    expect(val()).toBe("audio");
  });

  it("does not call onChange when disabled", () => {
    const onChange = vi.fn();
    const { getByText } = render(() => (
      <PillGroup options={FORMAT_OPTIONS} value="video" onChange={onChange} disabled />
    ));
    fireEvent.click(getByText("Аудио"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
