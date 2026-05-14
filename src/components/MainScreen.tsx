import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  isEngineUpdating,
  setIsEngineUpdating,
  engineUpdatePct,
  setEngineUpdatePct,
} from "../stores/engineStore";
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

interface QueueItem {
  url: string;
  outputDir: string;
  format: Format;
  quality: Quality;
  sponsorBlock: boolean;
}

export function MainScreen() {
  const [url, setUrl] = createSignal("");
  const [format, setFormat] = createSignal<Format>("video");
  const [quality, setQuality] = createSignal<Quality>("1080");
  const [outputDir, setOutputDir] = createSignal("~/Downloads");
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [progress, setProgress] = createSignal({ pct: 0, speed: "", eta: "" });
  const [downloadQueue, setDownloadQueue] = createSignal<QueueItem[]>([]);
  const [isSponsorBlockEnabled, setIsSponsorBlockEnabled] = createSignal(false);

  let unlistenDownloadStdout: (() => void) | undefined;
  let unlistenDownloadDone: (() => void) | undefined;

  const cleanupDownload = () => {
    unlistenDownloadStdout?.();
    unlistenDownloadDone?.();
    unlistenDownloadStdout = undefined;
    unlistenDownloadDone = undefined;
  };

  const startDownload = async (item?: QueueItem) => {
    const dlUrl    = item?.url       ?? url();
    const dlDir    = item?.outputDir ?? outputDir();
    const dlFormat = item?.format    ?? format();
    const dlQuality= item?.quality   ?? quality();
    const dlSponsorBlock = item?.sponsorBlock ?? isSponsorBlockEnabled();

    setIsDownloading(true);
    setProgress({ pct: 0, speed: "", eta: "" });

    unlistenDownloadStdout = await listen<{ line: string }>("ytdlp-stdout", (e) => {
      const m = e.payload.line.match(
        /\[download\]\s+(\d+\.?\d*)%.*?([\d.]+\s*\w+\/s).*?ETA\s+(\S+)/
      );
      if (m) setProgress({ pct: parseFloat(m[1]), speed: m[2], eta: m[3] });
    });

    unlistenDownloadDone = await listen("ytdlp-done", () => {
      setIsDownloading(false);
      setProgress({ pct: 0, speed: "", eta: "" });
      cleanupDownload();
    });

    invoke("start_download", {
      url: dlUrl,
      outputDir: dlDir,
      format: dlFormat,
      quality: dlQuality,
      sponsorblock: dlSponsorBlock,
    }).catch(() => {
      setIsDownloading(false);
      cleanupDownload();
    });
  };

  const handleDownloadClick = () => {
    if (isEngineUpdating()) {
      setDownloadQueue(q => [
        ...q,
        {
          url: url(),
          outputDir: outputDir(),
          format: format(),
          quality: quality(),
          sponsorBlock: isSponsorBlockEnabled(),
        },
      ]);
      setUrl(""); // clear field so user can queue another URL if desired
    } else {
      startDownload();
    }
  };

  const cancelDownload = () => {
    setIsDownloading(false);
    setProgress({ pct: 0, speed: "", eta: "" });
    setUrl("");
    cleanupDownload();
  };

  onMount(async () => {
    const unlistenUpdateStart = await listen("ytdlp-update-start", () => {
      setIsEngineUpdating(true);
    });

    const unlistenUpdateProgress = await listen<number>("ytdlp-update-progress", (e) => {
      setEngineUpdatePct(e.payload);
    });

    const unlistenUpdateDone = await listen("ytdlp-update-done", () => {
      setIsEngineUpdating(false);
      setEngineUpdatePct(0);
      const queue = downloadQueue();
      if (queue.length > 0) {
        const [first, ...rest] = queue;
        setDownloadQueue(rest);
        startDownload(first);
      }
    });

    const unlistenUpdateError = await listen("ytdlp-update-error", () => {
      setIsEngineUpdating(false);
      setEngineUpdatePct(0);
    });

    onCleanup(() => {
      unlistenUpdateStart();
      unlistenUpdateProgress();
      unlistenUpdateDone();
      unlistenUpdateError();
      cleanupDownload();
    });
  });

  const queueLabel = () => {
    const n = downloadQueue().length;
    if (n === 0) return "";
    return n === 1 ? "1 загрузка в очереди" : `${n} загрузки в очереди`;
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

        {/* Engine-update progress strip */}
        <Show when={isEngineUpdating()}>
          <div
            style={{
              padding: "8px 20px 10px",
              "background-color": "#f5f5f5",
              "border-bottom": "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                "margin-bottom": "5px",
              }}
            >
              <span
                class="font-sans"
                style={{ "font-size": "11px", color: "#898989", "font-weight": "500" }}
              >
                Обновление движка…
              </span>
              <span
                class="font-sans"
                style={{ "font-size": "11px", color: "#898989" }}
              >
                {engineUpdatePct()}%
              </span>
            </div>
            <div
              style={{
                height: "3px",
                "background-color": "#e5e7eb",
                "border-radius": "9999px",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${engineUpdatePct()}%`,
                  "background-color": "#111111",
                  "border-radius": "9999px",
                  transition: "width 0.2s ease",
                }}
              />
            </div>
          </div>
        </Show>

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

          {/* SponsorBlock toggle */}
          <div
            style={{
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
              opacity: isDownloading() ? "0.5" : "1",
              "pointer-events": isDownloading() ? "none" : "auto",
            }}
          >
            <span
              class="font-sans"
              style={{ "font-size": "13px", "font-weight": "500", color: "#374151" }}
            >
              Вырезать рекламу (SponsorBlock)
            </span>
            <button
              role="switch"
              aria-checked={isSponsorBlockEnabled()}
              aria-label="Вырезать рекламу (SponsorBlock)"
              disabled={isDownloading()}
              onClick={() => setIsSponsorBlockEnabled(v => !v)}
              style={{
                position: "relative",
                width: "36px",
                height: "20px",
                "border-radius": "9999px",
                border: "none",
                cursor: "pointer",
                padding: "0",
                "background-color": isSponsorBlockEnabled() ? "#111111" : "#e5e7eb",
                transition: "background-color 0.15s ease",
                "flex-shrink": "0",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: "2px",
                  width: "16px",
                  height: "16px",
                  "border-radius": "50%",
                  "background-color": "#ffffff",
                  transition: "transform 0.15s ease",
                  transform: isSponsorBlockEnabled() ? "translateX(16px)" : "translateX(0)",
                }}
              />
            </button>
          </div>

          <Show
            when={isDownloading()}
            fallback={
              <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
                <FolderRow
                  path={outputDir()}
                  onSelect={setOutputDir}
                />
                <DownloadButton
                  disabled={url().trim() === ""}
                  onClick={handleDownloadClick}
                />
                <Show when={downloadQueue().length > 0}>
                  <p
                    class="font-sans"
                    style={{
                      "text-align": "center",
                      "font-size": "11px",
                      color: "#898989",
                      margin: "0",
                    }}
                  >
                    {queueLabel()}
                  </p>
                </Show>
              </div>
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
