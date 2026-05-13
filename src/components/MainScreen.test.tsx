import { render, fireEvent } from "@solidjs/testing-library";
import { MainScreen } from "./MainScreen";

describe("MainScreen", () => {
  it("renders URL input", () => {
    const { getByPlaceholderText } = render(() => <MainScreen />);
    expect(getByPlaceholderText("Вставьте ссылку на видео…")).toBeInTheDocument();
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
});
