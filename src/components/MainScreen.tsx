import { createSignal, Show } from "solid-js";
import { TopBar } from "./TopBar";
import { UrlInput } from "./UrlInput";
import { PillGroup } from "./PillGroup";
import { FolderRow } from "./FolderRow";
import { DownloadButton } from "./DownloadButton";
import { ProgressCard } from "./ProgressCard";

const FORMAT_OPTIONS = [
  { value: "video" as const, label: "Видео" },
  { value: "audio" as const, label: "Аудио" },
];

const QUALITY_OPTIONS = [
  { value: "1080" as const, label: "1080p" },
  { value: "720" as const, label: "720p" },
  { value: "480" as const, label: "480p" },
];

type Format = "video" | "audio";
type Quality = "1080" | "720" | "480";

export function MainScreen() {
  const [url, setUrl] = createSignal("");
  const [format, setFormat] = createSignal<Format>("video");
  const [quality, setQuality] = createSignal<Quality>("1080");
  const [outputDir, setOutputDir] = createSignal("~/Downloads");
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [progress] = createSignal({ pct: 0, speed: "", eta: "" });

  const startDownload = () => setIsDownloading(true);
  const cancelDownload = () => {
    setIsDownloading(false);
    setUrl("");
  };

  return (
    <div
      class="min-h-screen bg-surface-soft flex items-center justify-center"
      style={{ padding: "24px" }}
    >
      <div
        class="bg-canvas"
        style={{
          width: "400px",
          border: "1px solid #e5e7eb",
          "border-radius": "12px",
          "box-shadow": "0 4px 12px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <TopBar />

        <div style={{ padding: "20px", display: "flex", "flex-direction": "column", gap: "16px" }}>
          <UrlInput
            value={url()}
            onChange={setUrl}
            disabled={isDownloading()}
          />

          <div
            style={{
              display: "grid",
              "grid-template-columns": format() === "video" ? "1fr 1fr" : "1fr",
              gap: "12px",
              opacity: isDownloading() ? "0.5" : "1",
              "pointer-events": isDownloading() ? "none" : "auto",
            }}
          >
            <div>
              <div
                class="font-sans font-semibold text-body uppercase"
                style={{ "font-size": "11px", "letter-spacing": "0.4px", "margin-bottom": "6px" }}
              >
                Формат
              </div>
              <PillGroup
                options={FORMAT_OPTIONS}
                value={format()}
                onChange={setFormat}
                disabled={isDownloading()}
              />
            </div>

            <Show when={format() === "video"}>
              <div>
                <div
                  class="font-sans font-semibold text-body uppercase"
                  style={{ "font-size": "11px", "letter-spacing": "0.4px", "margin-bottom": "6px" }}
                >
                  Качество
                </div>
                <PillGroup
                  options={QUALITY_OPTIONS}
                  value={quality()}
                  onChange={setQuality}
                  disabled={isDownloading()}
                />
              </div>
            </Show>
          </div>

          <Show
            when={isDownloading()}
            fallback={
              <>
                <FolderRow
                  path={outputDir()}
                  onSelect={setOutputDir}
                />
                <DownloadButton
                  disabled={url().trim() === ""}
                  onClick={startDownload}
                />
              </>
            }
          >
            <ProgressCard
              pct={progress().pct}
              speed={progress().speed}
              eta={progress().eta}
              onCancel={cancelDownload}
            />
          </Show>
        </div>
      </div>
    </div>
  );
}
