type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
};

export function PillGroup<T extends string>(props: Props<T>) {
  return (
    <div
      class="glass-surface inline-flex rounded-pill p-1"
    >
      {props.options.map((opt) => (
        <button
          type="button"
          onClick={() => !props.disabled && props.onChange(opt.value)}
          disabled={props.disabled}
          class="font-sans rounded-pill cursor-pointer transition-colors duration-150 ease-apple disabled:cursor-not-allowed"
          style={{
            "font-size": "13px",
            padding: "7px 16px",
            "font-weight": props.value === opt.value ? "600" : "500",
            background: props.value === opt.value ? "#111111" : "transparent",
            color: props.value === opt.value ? "#ffffff" : "#6b7280",
            border: "none",
            "box-shadow": "none",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
