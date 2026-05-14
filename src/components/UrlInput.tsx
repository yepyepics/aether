import { t } from "../store/i18n";

type Props = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export function UrlInput(props: Props) {
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      props.onChange(text);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div>
      <div
        class="font-sans font-semibold text-body"
        style={{ "font-size": "12px", "margin-bottom": "8px" }}
      >
        {t("inputLabel")}
      </div>
      <div
        class="glass-control url-input-shell rounded-xl transition-colors duration-150 ease-apple focus-within:bg-canvas"
      >
        <input
          type="text"
          value={props.value}
          onInput={(e) => props.onChange(e.currentTarget.value)}
          disabled={props.disabled}
          placeholder={t("inputPlaceholder")}
          class="flex-1 font-sans bg-transparent outline-none min-w-0 text-ink"
          style={{ "font-size": "14px" }}
        />
        <div class="url-input-actions">
          <div class="url-input-divider" />
          <button
            type="button"
            onClick={paste}
            disabled={props.disabled}
            class="url-input-action"
          >
            {t("btnPaste")}
          </button>
        </div>
      </div>
    </div>
  );
}
