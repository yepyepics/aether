import { formatUiVersion } from "../lib/version";

type ActionConfig = {
  label: string;
  ariaLabel: string;
  onClick: () => void;
};

type Props = {
  version?: string;
  leadingAction?: ActionConfig;
  trailingAction?: ActionConfig;
};

export function TopBar(props: Props) {
  return (
    <div
      class="flex items-center justify-between border-b border-hairline bg-canvas"
      style={{ padding: "0 16px", height: "52px" }}
    >
      <div class="flex items-center" style={{ gap: "10px" }}>
        {props.leadingAction ? (
          <button
            type="button"
            aria-label={props.leadingAction.ariaLabel}
            onClick={props.leadingAction.onClick}
            class="font-sans font-semibold text-ink cursor-pointer rounded-md px-3 py-2 transition-colors duration-150 ease-apple hover:bg-surface-soft"
            style={{
              "font-size": "13px",
              border: "none",
              background: "transparent",
            }}
          >
            {props.leadingAction.label}
          </button>
        ) : null}
        <span
          class="font-sans font-semibold text-ink"
          style={{ "font-size": "14px", "letter-spacing": "-0.3px" }}
        >
          Aether
        </span>
      </div>
      <div class="flex items-center" style={{ gap: "8px" }}>
        <span
          class="glass-surface text-muted font-medium rounded-pill"
          style={{ "font-size": "12px", padding: "3px 10px" }}
        >
          {props.version ? formatUiVersion(props.version) : "—"}
        </span>
        {props.trailingAction ? (
          <button
            type="button"
            aria-label={props.trailingAction.ariaLabel}
            onClick={props.trailingAction.onClick}
            class="glass-control text-muted cursor-pointer rounded-full transition-colors duration-150 ease-apple hover:text-ink hover:bg-surface-soft"
            style={{
              "font-size": "16px",
              border: "none",
              width: "32px",
              height: "32px",
              padding: "0",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
            }}
          >
            {props.trailingAction.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
