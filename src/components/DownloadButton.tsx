type Props = {
  disabled: boolean;
  onClick: () => void;
};

export function DownloadButton(props: Props) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      class="w-full font-sans font-semibold rounded-md cursor-pointer disabled:cursor-not-allowed"
      style={{
        height: "40px",
        "font-size": "14px",
        background: props.disabled ? "#e5e7eb" : "#111111",
        color: props.disabled ? "#6b7280" : "#ffffff",
        border: "none",
      }}
    >
      Скачать
    </button>
  );
}
