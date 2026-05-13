type Props = {
  version?: string;
};

export function TopBar(props: Props) {
  return (
    <div
      class="flex items-center justify-between bg-canvas border-b border-hairline-soft"
      style={{ padding: "0 20px", height: "48px" }}
    >
      <span
        class="font-sans font-semibold text-ink"
        style={{ "font-size": "14px", "letter-spacing": "-0.3px" }}
      >
        yt-dlgui
      </span>
      <div class="flex items-center" style={{ gap: "8px" }}>
        <span
          class="bg-surface-card text-muted font-medium rounded-pill"
          style={{ "font-size": "12px", padding: "3px 10px" }}
        >
          {props.version ?? "v2025.5"}
        </span>
        <span class="text-muted cursor-pointer" style={{ "font-size": "16px" }}>
          ⚙
        </span>
      </div>
    </div>
  );
}
