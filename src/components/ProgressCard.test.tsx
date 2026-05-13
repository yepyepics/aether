import { render, fireEvent } from "@solidjs/testing-library";
import { ProgressCard } from "./ProgressCard";
import { describe, it, expect, vi } from "vitest";

describe("ProgressCard", () => {
  it("displays percentage", () => {
    const { getByText } = render(() => (
      <ProgressCard pct={42} speed="2.5 MiB/s" eta="00:38" onCancel={() => {}} />
    ));
    expect(getByText("42%")).toBeInTheDocument();
  });

  it("displays speed and ETA", () => {
    const { getByText } = render(() => (
      <ProgressCard pct={10} speed="1.2 MiB/s" eta="01:05" onCancel={() => {}} />
    ));
    expect(getByText("1.2 MiB/s")).toBeInTheDocument();
    expect(getByText("01:05")).toBeInTheDocument();
  });

  it("calls onCancel when button clicked", () => {
    const onCancel = vi.fn();
    const { getByText } = render(() => (
      <ProgressCard pct={0} speed="" eta="" onCancel={onCancel} />
    ));
    fireEvent.click(getByText("Отменить"));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
