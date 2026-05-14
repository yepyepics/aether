import { createSignal, Show, onCleanup, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  engineUpdatePct,
  isEngineUpdating,
  setEngineUpdatePct,
  setIsEngineUpdating,
} from "../stores/engineStore";
import {
  defaultAudioFormat,
  defaultVideoFormat,
  initializePreferences,
} from "../stores/preferencesStore";
import { setCurrentView } from "../stores/navigationStore";
import { t } from "../store/i18n";
import { DownloadButton } from "./DownloadButton";
import { FolderRow } from "./FolderRow";
import { PillGroup } from "./PillGroup";
import { ProgressCard } from "./ProgressCard";
import { TopBar } from "./TopBar";
import { UrlInput } from "./UrlInput";

const QUALITY_OPTIONS = [
  { value: "1080" as const, label: "1080p" },
  { value: "720" as const, label: "720p" },
  { value: "480" as const, label: "480p" },
];

const COMPLETION_HOLD_MS = 1400;

type Format = "video" | "audio";
type Quality = "1080" | "720" | "480";
type DownloadPhase = "idle" | "downloading" | "completed";

interface QueueItem {
  url: string;
  outputDir: string;
  format: Format;
  quality: Quality;
  sponsorBlock: boolean;
  ecoMode: boolean;
}

const fileLabelFromPath = (rawValue: string, fallbackLabel: string) => {
  const normalized = rawValue.trim().replace(/^"+|"+$/g, "");
  const segments = normalized.split(/[\\/]/).filter(Boolean);
  const fileName = segments[segments.length - 1]?.trim();
  return fileName || normalized || fallbackLabel;
};

const fallbackLabelFromUrl = (rawUrl: string, fallbackLabel: string) => {
  const trimmed = rawUrl.trim();
  if (!trimmed) return fallbackLabel;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./, "");
    const videoId = parsed.searchParams.get("v");
    if (videoId) return `${host}/${videoId}`;

    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    return lastSegment ? decodeURIComponent(lastSegment) : host;
  } catch {
    return trimmed.replace(/^https?:\/\//, "");
  }
};

export function MainScreen() {
  const formatOptions = () => [
    { value: "video" as const, label: t("formatVideo") },
    { value: "audio" as const, label: t("formatAudio") },
  ];
  const [url, setUrl] = createSignal("");
  const [format, setFormat] = createSignal<Format>("video");
  const [quality, setQuality] = createSignal<Quality>("1080");
  const [outputDir, setOutputDir] = createSignal("~/Downloads");
  const [isDownloading, setIsDownloading] = createSignal(false);
  const [downloadPhase, setDownloadPhase] = createSignal<DownloadPhase>("idle");
  const [progress, setProgress] = createSignal({ pct: 0, speed: "", eta: "" });
  const [currentDownloadLabel, setCurrentDownloadLabel] = createSignal(t("currentFileLabel"));
  const [downloadQueue, setDownloadQueue] = createSignal<QueueItem[]>([]);
  const [isSponsorBlockEnabled, setIsSponsorBlockEnabled] = createSignal(false);
  const [isEcoMode, setIsEcoMode] = createSignal(false);

  let unlistenDownloadStdout: (() => void) | undefined;
  let unlistenDownloadDone: (() => void) | undefined;
  let completionTimer: ReturnType<typeof setTimeout> | undefined;

  const cleanupDownload = () => {
    unlistenDownloadStdout?.();
    unlistenDownloadDone?.();
    unlistenDownloadStdout = undefined;
    unlistenDownloadDone = undefined;
  };

  const clearCompletionTimer = () => {
    if (completionTimer) {
      clearTimeout(completionTimer);
      completionTimer = undefined;
    }
  };

  const resetDownloadUi = () => {
    clearCompletionTimer();
    setDownloadPhase("idle");
    setProgress({ pct: 0, speed: "", eta: "" });
    setCurrentDownloadLabel(t("currentFileLabel"));
  };

  const startDownload = async (item?: QueueItem) => {
    const dlUrl = item?.url ?? url();
    const dlDir = item?.outputDir ?? outputDir();
    const dlFormat = item?.format ?? format();
    const dlQuality = item?.quality ?? quality();
    const dlSponsorBlock = item?.sponsorBlock ?? isSponsorBlockEnabled();
    const dlEcoMode = item?.ecoMode ?? isEcoMode();

    clearCompletionTimer();
    setIsDownloading(true);
    setDownloadPhase("downloading");
    setCurrentDownloadLabel(fallbackLabelFromUrl(dlUrl, t("currentFileLabel")));
    setProgress({ pct: 0, speed: "", eta: "" });

    unlistenDownloadStdout = await listen<{ line: string }>("ytdlp-stdout", (e) => {
      const labelMatch =
        e.payload.line.match(/\[download\]\s+Destination:\s+(.+)$/) ??
        e.payload.line.match(/\[ExtractAudio\]\s+Destination:\s+(.+)$/) ??
        e.payload.line.match(/\[Merger\]\s+Merging formats into\s+"(.+)"$/);

      if (labelMatch?.[1]) {
        setCurrentDownloadLabel(fileLabelFromPath(labelMatch[1], t("currentFileLabel")));
      }

      const m = e.payload.line.match(
        /\[download\]\s+(\d+\.?\d*)%.*?([\d.]+\s*\w+\/s).*?ETA\s+(\S+)/
      );
      if (m) {
        setProgress({
          pct: Math.min(100, parseFloat(m[1])),
          speed: m[2],
          eta: m[3],
        });
      }
    });

    unlistenDownloadDone = await listen("ytdlp-done", () => {
      setIsDownloading(false);
      setDownloadPhase("completed");
      setProgress(prev => ({
        pct: 100,
        speed: prev.speed,
        eta: prev.eta,
      }));
      cleanupDownload();
      clearCompletionTimer();
      completionTimer = setTimeout(() => {
        resetDownloadUi();
      }, COMPLETION_HOLD_MS);
    });

    invoke("start_download", {
      url: dlUrl,
      outputDir: dlDir,
      format: dlFormat,
      quality: dlQuality,
      sponsorblock: dlSponsorBlock,
      ecoMode: dlEcoMode,
      videoFormat: defaultVideoFormat(),
      audioFormat: defaultAudioFormat(),
    }).catch(() => {
      setIsDownloading(false);
      resetDownloadUi();
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
          ecoMode: isEcoMode(),
        },
      ]);
      setUrl("");
    } else {
      startDownload();
    }
  };

  const cancelDownload = () => {
    setIsDownloading(false);
    resetDownloadUi();
    setUrl("");
    cleanupDownload();
  };

  onMount(async () => {
    initializePreferences();

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
      clearCompletionTimer();
      cleanupDownload();
    });
  });

  const queueLabel = () => {
    const n = downloadQueue().length;
    if (n === 0) return "";
    const mod10 = n % 10;
    const mod100 = n % 100;

    if (mod10 === 1 && mod100 !== 11) return `${n} ${t("queueOne")}`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return `${n} ${t("queueFew")}`;
    }
    return `${n} ${t("queueMany")}`;
  };

  return (
    <section
      class="window-glass h-full overflow-hidden text-ink"
      style={{ display: "flex", "flex-direction": "column", "min-height": "0" }}
    >
      <TopBar
        trailingAction={{
          label: "⚙",
          ariaLabel: t("settingsOpenAriaLabel"),
          onClick: () => setCurrentView("settings"),
        }}
      />

      <Show when={isEngineUpdating()}>
        <div
          class="glass-surface border-b border-hairline-soft"
          style={{ padding: "10px 16px" }}
        >
          <div
            style={{
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
              "margin-bottom": "6px",
            }}
          >
            <span
              class="font-sans"
              style={{ "font-size": "11px", color: "#6b7280", "font-weight": "500" }}
            >
              {t("engineUpdateLabel")}
            </span>
            <span
              class="font-sans"
              style={{ "font-size": "11px", color: "#6b7280" }}
            >
              {engineUpdatePct()}%
            </span>
          </div>
          <div
            class="overflow-hidden rounded-pill bg-hairline-soft"
            style={{ height: "4px" }}
          >
            <div
              class="bg-primary rounded-pill transition-[width] duration-500 ease-apple"
              style={{
                height: "100%",
                width: `${engineUpdatePct()}%`,
              }}
            />
          </div>
        </div>
      </Show>

      <div
        style={{
          padding: "18px 18px 16px",
          display: "flex",
          "flex-direction": "column",
          gap: "14px",
          flex: "1",
          "min-height": "0",
          overflow: "auto",
        }}
      >
        <div style={{ display: "flex", "flex-direction": "column", gap: "6px" }}>
          <h1
            class="font-sans font-semibold text-ink"
            style={{ margin: "0", "font-size": "20px", "letter-spacing": "-0.4px" }}
          >
            {t("mainTitle")}
          </h1>
          <p
            class="font-sans text-muted"
            style={{ margin: "0", "font-size": "13px", "line-height": "1.6" }}
          >
            {t("mainDescription")}
          </p>
        </div>

        <UrlInput
          value={url()}
          onChange={setUrl}
          disabled={isDownloading()}
        />

        <div
          class="transition-opacity duration-150 ease-apple"
          style={{
            display: "grid",
            "grid-template-columns": format() === "video" ? "1fr 1fr" : "1fr",
            gap: "10px",
            opacity: isDownloading() ? "0.5" : "1",
            "pointer-events": isDownloading() ? "none" : "auto",
          }}
        >
          <div>
            <div
              class="font-sans font-semibold text-body"
              style={{ "font-size": "12px", "margin-bottom": "8px" }}
            >
              {t("formatLabel")}
            </div>
            <PillGroup
              options={formatOptions()}
              value={format()}
              onChange={setFormat}
              disabled={isDownloading()}
            />
          </div>

          <Show when={format() === "video"}>
            <div>
              <div
                class="font-sans font-semibold text-body"
                style={{ "font-size": "12px", "margin-bottom": "8px" }}
              >
                {t("qualityLabel")}
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

        <div
          class="glass-surface transition-opacity duration-150 ease-apple"
          style={{
            display: "grid",
            "grid-template-columns": "1fr auto",
            "align-items": "center",
            gap: "12px",
            padding: "12px 14px",
            "border-radius": "12px",
            opacity: isDownloading() ? "0.5" : "1",
            "pointer-events": isDownloading() ? "none" : "auto",
          }}
        >
          <div style={{ display: "flex", "flex-direction": "column", gap: "2px" }}>
            <span
              class="font-sans"
              style={{ "font-size": "13px", "font-weight": "600", color: "#111111" }}
            >
              {t("sponsorBlockLabel")}
            </span>
            <span
              class="font-sans text-muted"
              style={{ "font-size": "11px" }}
            >
              {t("sponsorBlockDescription")}
            </span>
          </div>

          <button
            role="switch"
            aria-checked={isSponsorBlockEnabled()}
            aria-label={t("sponsorBlockAriaLabel")}
            disabled={isDownloading()}
            onClick={() => setIsSponsorBlockEnabled(v => !v)}
            class="relative cursor-pointer rounded-full border border-hairline transition-colors duration-150 ease-apple"
            style={{
              width: "40px",
              height: "22px",
              padding: "0",
              "background-color": isSponsorBlockEnabled() ? "#111111" : "#ffffff",
              "flex-shrink": "0",
            }}
          >
            <span
              class="absolute rounded-full bg-canvas transition-transform duration-150 ease-apple"
              style={{
                top: "2px",
                left: "2px",
                width: "16px",
                height: "16px",
                border: "1px solid #e5e7eb",
                transform: isSponsorBlockEnabled() ? "translateX(18px)" : "translateX(0)",
              }}
            />
          </button>
        </div>

        <Show
          when={downloadPhase() !== "idle"}
          fallback={
            <div style={{ display: "flex", "flex-direction": "column", gap: "8px", "margin-top": "auto" }}>
              <FolderRow
                path={outputDir()}
                onSelect={setOutputDir}
              />
              <div style={{ display: "flex", gap: "10px", "align-items": "stretch" }}>
                <div style={{ flex: "1 1 auto" }}>
                  <DownloadButton
                    disabled={url().trim() === ""}
                    onClick={handleDownloadClick}
                  />
                </div>

                <div class="group relative" style={{ display: "flex" }}>
                  <button
                    type="button"
                    aria-pressed={isEcoMode()}
                    aria-label={t("ecoModeAriaLabel")}
                    title={t("ecoModeTooltip")}
                    disabled={isDownloading()}
                    onClick={() => setIsEcoMode(v => !v)}
                    class="font-sans font-semibold rounded-md border cursor-pointer transition-colors duration-300 ease-apple active:scale-[0.96] disabled:cursor-not-allowed"
                    style={{
                      width: "58px",
                      height: "40px",
                      padding: "0",
                      "font-size": "13px",
                      "flex-shrink": "0",
                      "background-color": isEcoMode() ? "#dcfce7" : "#ffffff",
                      color: isEcoMode() ? "#166534" : "#4b5563",
                      "border-color": isEcoMode() ? "#86efac" : "#e5e7eb",
                    }}
                  >
                    {t("ecoModeLabel")}
                  </button>

                  <span
                    class="pointer-events-none absolute right-0 top-0 z-10 -translate-y-[calc(100%+8px)] rounded-md bg-[#111111] px-3 py-2 font-sans text-[11px] text-white opacity-0 shadow-sm transition-opacity duration-200 ease-apple group-hover:opacity-100 group-focus-within:opacity-100"
                    style={{
                      width: "max-content",
                      "max-width": "220px",
                      "white-space": "normal",
                      "text-align": "center",
                    }}
                  >
                    {t("ecoModeTooltip")}
                  </span>
                </div>
              </div>
              <Show when={downloadQueue().length > 0}>
                <p
                  class="font-sans"
                  style={{
                    "text-align": "center",
                    "font-size": "11px",
                    color: "#6b7280",
                    margin: "2px 0 0",
                  }}
                >
                  {queueLabel()}
                </p>
              </Show>
            </div>
          }
        >
          <div style={{ "margin-top": "auto" }}>
            <ProgressCard
              label={currentDownloadLabel()}
              pct={progress().pct}
              speed={progress().speed}
              eta={progress().eta}
              isDownloading={downloadPhase() === "downloading"}
              onCancel={cancelDownload}
            />
          </div>
        </Show>
      </div>
    </section>
  );
}
