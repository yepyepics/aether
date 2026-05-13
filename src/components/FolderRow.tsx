import { open } from "@tauri-apps/plugin-dialog";

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
        class="font-sans font-semibold text-body uppercase"
        style={{ "font-size": "11px", "letter-spacing": "0.4px", "margin-bottom": "6px" }}
      >
        Папка сохранения
      </div>
      <button
        onClick={pickFolder}
        disabled={props.disabled}
        class="w-full flex items-center bg-surface-card disabled:opacity-50"
        style={{ padding: "0 14px", height: "40px", "border-radius": "8px", border: "none" }}
      >
        <span class="flex-1 text-left font-sans text-body" style={{ "font-size": "13px" }}>
          {props.path}
        </span>
        <span
          class="font-sans font-semibold"
          style={{ "font-size": "12px", color: "#3b82f6" }}
        >
          Изменить →
        </span>
      </button>
    </div>
  );
}
