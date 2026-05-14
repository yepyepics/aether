import { t } from "../store/i18n";

type Props = {
  disabled: boolean;
  onClick: () => void;
};

export function DownloadButton(props: Props) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      class="w-full font-sans font-semibold cursor-pointer rounded-md border transition-colors duration-150 ease-apple disabled:cursor-not-allowed"
      style={{
        height: "40px",
        "font-size": "14px",
        background: props.disabled ? "#e5e7eb" : "#111111",
        color: props.disabled ? "#6b7280" : "#ffffff",
        "border-color": props.disabled ? "#e5e7eb" : "#111111",
      }}
    >
      {t("btnDownload")}
    </button>
  );
}
