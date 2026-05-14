import { Show } from "solid-js";
import { t } from "../store/i18n";

type Props = {
  label: string;
  pct: number;
  speed: string;
  eta: string;
  isDownloading: boolean;
  onCancel: () => void;
};

export function ProgressCard(props: Props) {
  const pctLabel = () => {
    const value = Number.isInteger(props.pct) ? props.pct.toString() : props.pct.toFixed(1);
    return `${value}%`;
  };

  const speedLabel = () => props.speed || t("speedFallback");
  const etaLabel = () => (props.isDownloading ? props.eta || t("etaFallback") : t("etaDone"));

  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
      <div
        class="glass-surface rounded-lg"
        style={{ padding: "14px", display: "flex", "flex-direction": "column", gap: "10px" }}
      >
        <div class="flex items-center justify-between">
          <div class="flex min-w-0 items-center gap-2">
            <span
              class={`h-2 w-2 shrink-0 rounded-full ${
                props.isDownloading
                  ? "bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.6)]"
                  : "bg-emerald-500"
              }`}
            />
            <div class="min-w-0">
              <span class="block truncate font-sans font-semibold text-ink" style={{ "font-size": "13px" }}>
                {props.label}
              </span>
              <span class="block font-sans text-muted" style={{ "font-size": "11px" }}>
                {props.isDownloading ? t("statusDownloading") : t("statusCompleted")}
              </span>
            </div>
          </div>
          <span class="font-mono tabular-nums font-semibold text-ink" style={{ "font-size": "13px" }}>
            {pctLabel()}
          </span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-hairline-soft">
          <div
            class={`relative h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ease-apple ${
              props.isDownloading
                ? "from-indigo-500 to-cyan-400"
                : "from-emerald-500 to-emerald-400"
            }`}
            style={{
              width: `${props.pct}%`,
            }}
          >
            <Show when={props.isDownloading}>
              <div class="absolute inset-0 bg-[length:200%_100%] bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.14)_38%,rgba(255,255,255,0.65)_50%,rgba(255,255,255,0.14)_62%,transparent_80%)] animate-shimmer" />
            </Show>
          </div>
        </div>
        <div class="flex justify-between">
          <span class="font-mono tabular-nums text-muted" style={{ "font-size": "12px" }}>
            {speedLabel()}
          </span>
          <span class="font-mono tabular-nums text-muted" style={{ "font-size": "12px" }}>
            {etaLabel()}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={props.onCancel}
        disabled={!props.isDownloading}
        class={`glass-control w-full rounded-md font-sans font-semibold text-ink transition-colors duration-150 ease-apple ${
          props.isDownloading
            ? "cursor-pointer hover:bg-surface-soft"
            : "cursor-default opacity-70"
        }`}
        style={{ height: "40px", "font-size": "14px" }}
      >
        {props.isDownloading ? t("btnCancel") : t("btnDone")}
      </button>
    </div>
  );
}
