import { render } from "@solidjs/testing-library";
import { TopBar } from "./TopBar";

describe("TopBar", () => {
  it("renders app name", () => {
    const { getByText } = render(() => <TopBar />);
    expect(getByText("yt-dlgui")).toBeInTheDocument();
  });

  it("renders version badge", () => {
    const { getByText } = render(() => <TopBar version="v1.2.3" />);
    expect(getByText("v1.2.3")).toBeInTheDocument();
  });
});
