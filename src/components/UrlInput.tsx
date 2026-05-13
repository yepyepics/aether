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
        class="font-sans font-semibold text-body uppercase"
        style={{ "font-size": "11px", "letter-spacing": "0.4px", "margin-bottom": "6px" }}
      >
        Ссылка
      </div>
      <div
        class="flex items-center bg-canvas border border-hairline"
        style={{ padding: "0 12px", height: "40px", "border-radius": "8px" }}
      >
        <input
          type="text"
          value={props.value}
          onInput={(e) => props.onChange(e.currentTarget.value)}
          disabled={props.disabled}
          placeholder="Вставьте ссылку на видео…"
          class="flex-1 font-sans bg-transparent outline-none min-w-0 text-ink"
          style={{ "font-size": "13px" }}
        />
        <button
          onClick={paste}
          disabled={props.disabled}
          class="font-sans font-semibold text-ink border-l border-hairline cursor-pointer disabled:opacity-50"
          style={{ "font-size": "12px", "padding-left": "10px", "margin-left": "8px" }}
        >
          Вставить
        </button>
      </div>
    </div>
  );
}
