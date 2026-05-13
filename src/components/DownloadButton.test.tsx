import { render, fireEvent } from "@solidjs/testing-library";
import { DownloadButton } from "./DownloadButton";
import { describe, it, expect, vi } from "vitest";

describe("DownloadButton", () => {
  it("renders Скачать when not downloading", () => {
    const { getByText } = render(() => (
      <DownloadButton disabled={false} onClick={() => {}} />
    ));
    expect(getByText("Скачать")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    const { getByRole } = render(() => (
      <DownloadButton disabled onClick={() => {}} />
    ));
    expect(getByRole("button")).toBeDisabled();
  });

  it("calls onClick when enabled and clicked", () => {
    const onClick = vi.fn();
    const { getByRole } = render(() => (
      <DownloadButton disabled={false} onClick={onClick} />
    ));
    fireEvent.click(getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
