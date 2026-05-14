import { open } from "@tauri-apps/plugin-dialog";
import { t } from "../store/i18n";

type Props = {
  path: string;
  onSelect: (path: string) => void;
  disabled?: boolean;
};

export function FolderRow(props: Props) {
  const pickFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (typeof selected === "string") {
        props.onSelect(selected);
      }
    } catch {
      // Not running inside Tauri context (pnpm dev without backend)
    }
  };

  return (
    <div>
      <div
        class="font-sans font-semibold text-body"
        style={{ "font-size": "12px", "margin-bottom": "8px" }}
      >
        {t("saveFolderLabel")}
      </div>
      <button
        type="button"
        onClick={pickFolder}
        disabled={props.disabled}
        class="glass-control w-full flex items-center rounded-md transition-colors duration-150 ease-apple hover:bg-surface-soft disabled:opacity-50"
        style={{ padding: "0 14px", height: "40px" }}
      >
        <span class="flex-1 text-left font-sans text-body" style={{ "font-size": "13px" }}>
          {props.path}
        </span>
        <span
          class="font-sans font-semibold"
          style={{ "font-size": "12px", color: "#111111" }}
        >
          {t("btnChoose")}
        </span>
      </button>
    </div>
  );
}
