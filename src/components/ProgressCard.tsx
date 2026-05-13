type Props = {
  pct: number;
  speed: string;
  eta: string;
  onCancel: () => void;
};

export function ProgressCard(props: Props) {
  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
      <div
        class="bg-surface-card rounded-lg"
        style={{ padding: "16px", display: "flex", "flex-direction": "column", gap: "10px" }}
      >
        <div class="flex items-center justify-between">
          <span class="font-sans font-semibold text-ink" style={{ "font-size": "13px" }}>
            Загрузка…
          </span>
          <span class="font-sans font-semibold text-ink" style={{ "font-size": "13px" }}>
            {props.pct}%
          </span>
        </div>
        <div
          class="bg-surface-strong rounded-pill overflow-hidden"
          style={{ height: "6px" }}
        >
          <div
            class="bg-primary rounded-pill"
            style={{
              height: "6px",
              width: `${props.pct}%`,
              transition: "width 0.3s ease",
            }}
          />
        </div>
        <div class="flex justify-between">
          <span class="font-sans text-muted" style={{ "font-size": "12px" }}>{props.speed}</span>
          <span class="font-sans text-muted" style={{ "font-size": "12px" }}>{props.eta}</span>
        </div>
      </div>
      <button
        onClick={props.onCancel}
        class="w-full font-sans font-semibold rounded-md cursor-pointer bg-canvas text-ink border border-hairline"
        style={{ height: "40px", "font-size": "14px" }}
      >
        Отменить
      </button>
    </div>
  );
}
