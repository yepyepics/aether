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
      class="inline-flex rounded-pill"
      style={{ background: "#f8f9fa", padding: "4px" }}
    >
      {props.options.map((opt) => (
        <button
          onClick={() => !props.disabled && props.onChange(opt.value)}
          disabled={props.disabled}
          class="font-sans rounded-pill cursor-pointer disabled:cursor-not-allowed"
          style={{
            "font-size": "12px",
            padding: "5px 14px",
            "font-weight": props.value === opt.value ? "600" : "500",
            background: props.value === opt.value ? "#111111" : "transparent",
            color: props.value === opt.value ? "#ffffff" : "#6b7280",
            border: "none",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
