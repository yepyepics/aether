import { For, Show, createMemo, onMount } from "solid-js";
import {
  defaultAudioFormat,
  defaultVideoFormat,
  initializePreferences,
  setDefaultAudioFormat,
  setDefaultVideoFormat,
  type AudioExtractFormat,
  type VideoContainerFormat,
} from "../stores/preferencesStore";
import { useUpdater } from "../hooks/useUpdater";
import { changeLanguage, locale, t, type Locale } from "../store/i18n";
import { setCurrentView } from "../stores/navigationStore";
import { TopBar } from "./TopBar";

type SelectCardProps<T extends string> = {
  label: string;
  hint: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
};

function SelectCard<T extends string>(props: SelectCardProps<T>) {
  return (
    <label
      class="settings-select-card glass-surface ease-apple"
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "10px",
        padding: "14px",
        "border-radius": "12px",
      }}
    >
      <div style={{ display: "flex", "flex-direction": "column", gap: "4px" }}>
        <span class="font-sans font-semibold text-ink" style={{ "font-size": "14px" }}>
          {props.label}
        </span>
        <span class="font-sans text-muted" style={{ "font-size": "12px", "line-height": "1.5" }}>
          {props.hint}
        </span>
      </div>

      <div style={{ position: "relative" }}>
        <select
          aria-label={props.label}
          value={props.value}
          onChange={(event) => props.onChange(event.currentTarget.value as T)}
          class="settings-select ease-apple font-sans text-ink"
          style={{
            width: "100%",
            height: "40px",
            padding: "0 38px 0 14px",
            border: "1px solid #e5e7eb",
            "border-radius": "8px",
            "background-color": "#ffffff",
            "font-size": "13px",
            appearance: "none",
            cursor: "pointer",
          }}
        >
          <For each={props.options}>
            {(option) => <option value={option.value}>{option.label}</option>}
          </For>
        </select>

        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            right: "14px",
            transform: "translateY(-50%)",
            color: "#6b7280",
            "font-size": "10px",
            "pointer-events": "none",
          }}
        >
          ▼
        </span>
      </div>
    </label>
  );
}

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: import("solid-js").JSX.Element;
};

function SettingsSection(props: SettingsSectionProps) {
  return (
    <section
      class="glass-surface"
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "14px",
        padding: "16px",
        "border-radius": "16px",
      }}
    >
      <div style={{ display: "flex", "flex-direction": "column", gap: "4px" }}>
        <h2
          class="font-sans font-semibold text-ink"
          style={{ margin: "0", "font-size": "15px", "letter-spacing": "-0.2px" }}
        >
          {props.title}
        </h2>
        <Show when={props.description}>
          <p
            class="font-sans text-muted"
            style={{ margin: "0", "font-size": "12px", "line-height": "1.55" }}
          >
            {props.description}
          </p>
        </Show>
      </div>

      {props.children}
    </section>
  );
}

function ToggleRow(props: {
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "flex-start",
        "justify-content": "space-between",
        gap: "12px",
        padding: "2px 0",
      }}
    >
      <div style={{ display: "flex", "flex-direction": "column", gap: "4px", flex: "1" }}>
        <span class="font-sans font-semibold text-ink" style={{ "font-size": "14px" }}>
          {props.label}
        </span>
        <span class="font-sans text-muted" style={{ "font-size": "12px", "line-height": "1.5" }}>
          {props.hint}
        </span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        aria-label={props.label}
        onClick={props.onToggle}
        class="ease-apple"
        style={{
          width: "46px",
          height: "28px",
          padding: "2px",
          border: "1px solid",
          "border-color": props.checked ? "#111111" : "#d4d4d8",
          "border-radius": "9999px",
          background: props.checked ? "#111111" : "#ffffff",
          cursor: "pointer",
          transition: "background-color 160ms var(--ease-apple), border-color 160ms var(--ease-apple)",
          "flex-shrink": "0",
        }}
      >
        <span
          style={{
            display: "block",
            width: "22px",
            height: "22px",
            "border-radius": "9999px",
            background: props.checked ? "#ffffff" : "#111111",
            transform: props.checked ? "translateX(18px)" : "translateX(0)",
            transition: "transform 160ms var(--ease-apple), background-color 160ms var(--ease-apple)",
          }}
        />
      </button>
    </div>
  );
}

export function SettingsScreen() {
  const {
    appVersion,
    availableUpdate,
    checkForUpdates,
    initializeUpdater,
    installUpdate,
    isAutoUpdateEnabled,
    setIsAutoUpdateEnabled,
    updateError,
    updateStatus,
  } = useUpdater();

  onMount(() => {
    initializePreferences();
    initializeUpdater();
  });

  const updateStatusText = createMemo(() => {
    switch (updateError()) {
      case "unavailable":
        return t("updatesUnavailableError");
      case "generic":
        return t("updatesCheckFailedError");
      default:
        return "";
    }
  });

  return (
    <section
      class="window-glass h-full overflow-hidden text-ink"
      style={{ display: "flex", "flex-direction": "column", "min-height": "0" }}
    >
      <TopBar
        leadingAction={{
          label: t("backToHomeLabel"),
          ariaLabel: t("backToHomeAriaLabel"),
          onClick: () => setCurrentView("home"),
        }}
      />

      <div
        style={{
          padding: "20px 18px 18px",
          display: "flex",
          "flex-direction": "column",
          gap: "18px",
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
            {t("settingsTitle")}
          </h1>
          <p
            class="font-sans text-muted"
            style={{ margin: "0", "font-size": "13px", "line-height": "1.6" }}
          >
            {t("settingsDescription")}
          </p>
        </div>

        <SettingsSection title={t("settingsGeneralSectionTitle")}>
          <div style={{ display: "flex", "flex-direction": "column", gap: "10px" }}>
            <SelectCard<Locale>
              label={t("languageLabel")}
              hint={t("languageHint")}
              value={locale()}
              onChange={changeLanguage}
              options={[
                { value: "ru", label: t("languageOptionRu") },
                { value: "en", label: t("languageOptionEn") },
              ]}
            />

            <SelectCard<VideoContainerFormat>
              label={t("defaultVideoFormatLabel")}
              hint={t("defaultVideoFormatHint")}
              value={defaultVideoFormat()}
              onChange={setDefaultVideoFormat}
              options={[
                { value: "mp4", label: "mp4" },
                { value: "mkv", label: "mkv" },
                { value: "webm", label: "webm" },
              ]}
            />

            <SelectCard<AudioExtractFormat>
              label={t("defaultAudioFormatLabel")}
              hint={t("defaultAudioFormatHint")}
              value={defaultAudioFormat()}
              onChange={setDefaultAudioFormat}
              options={[
                { value: "mp3", label: "mp3" },
                { value: "m4a", label: "m4a" },
                { value: "wav", label: "wav" },
              ]}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("updatesSectionTitle")}
          description={t("updatesSectionDescription")}
        >
          <ToggleRow
            label={t("autoUpdateLabel")}
            hint={t("autoUpdateHint")}
            checked={isAutoUpdateEnabled()}
            onToggle={() => setIsAutoUpdateEnabled(!isAutoUpdateEnabled())}
          />

          <div
            style={{
              height: "1px",
              background: "rgba(229, 231, 235, 0.9)",
              margin: "2px 0",
            }}
          />

          <div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
            <div style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "12px" }}>
              <span class="font-sans text-muted" style={{ "font-size": "12px" }}>
                {t("currentVersionLabel")}
              </span>
              <span class="font-mono text-ink" style={{ "font-size": "12px", "font-weight": "600" }}>
                {appVersion() || "—"}
              </span>
            </div>

            <Show when={updateStatus() === "up_to_date"}>
              <div
                class="glass-surface"
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "8px",
                  padding: "10px 12px",
                  "border-radius": "12px",
                  border: "1px solid rgba(16, 185, 129, 0.18)",
                  background: "rgba(236, 253, 245, 0.92)",
                }}
              >
                <span aria-hidden="true" style={{ color: "#059669", "font-size": "14px" }}>
                  ✓
                </span>
                <span class="font-sans" style={{ color: "#065f46", "font-size": "12px", "font-weight": "600" }}>
                  {t("updatesUpToDateLabel")}
                </span>
              </div>
            </Show>

            <Show when={updateStatus() === "update_available" && availableUpdate()}>
              <div
                class="glass-surface"
                style={{
                  display: "flex",
                  "align-items": "center",
                  gap: "8px",
                  padding: "10px 12px",
                  "border-radius": "12px",
                  border: "1px solid rgba(59, 130, 246, 0.16)",
                  background: "rgba(239, 246, 255, 0.95)",
                }}
              >
                <span class="font-sans" style={{ color: "#1d4ed8", "font-size": "12px", "font-weight": "600" }}>
                  {t("updatesAvailableLabel")} v{availableUpdate()?.version}
                </span>
              </div>
            </Show>

            <Show when={updateStatusText()}>
              <div
                class="glass-surface"
                role="alert"
                style={{
                  padding: "10px 12px",
                  "border-radius": "12px",
                  border: "1px solid rgba(239, 68, 68, 0.16)",
                  background: "rgba(254, 242, 242, 0.92)",
                }}
              >
                <span class="font-sans" style={{ color: "#991b1b", "font-size": "12px", "line-height": "1.5", "font-weight": "500" }}>
                  {updateStatusText()}
                </span>
              </div>
            </Show>

            <Show
              when={updateStatus() === "update_available" && availableUpdate()}
              fallback={
                <button
                  type="button"
                  onClick={() => void checkForUpdates()}
                  disabled={updateStatus() === "checking" || updateStatus() === "installing"}
                  class="ease-apple"
                  style={{
                    width: "100%",
                    height: "42px",
                    border: "1px solid #d4d4d8",
                    "border-radius": "12px",
                    background: "#ffffff",
                    color: "#111111",
                    "font-size": "13px",
                    "font-weight": "600",
                    cursor:
                      updateStatus() === "checking" || updateStatus() === "installing"
                        ? "not-allowed"
                        : "pointer",
                    opacity: updateStatus() === "checking" || updateStatus() === "installing" ? "0.7" : "1",
                  }}
                >
                  {updateStatus() === "checking"
                    ? t("updatesCheckingButton")
                    : t("updatesCheckButton")}
                </button>
              }
            >
              <button
                type="button"
                onClick={() => void installUpdate()}
                disabled={updateStatus() === "installing"}
                class="ease-apple"
                style={{
                  width: "100%",
                  height: "42px",
                  border: "none",
                  "border-radius": "12px",
                  background: "#111111",
                  color: "#ffffff",
                  "font-size": "13px",
                  "font-weight": "600",
                  cursor: updateStatus() === "installing" ? "not-allowed" : "pointer",
                  opacity: updateStatus() === "installing" ? "0.8" : "1",
                }}
              >
                {updateStatus() === "installing"
                  ? t("updatesInstallingButton")
                  : t("updatesInstallButton")}
              </button>
            </Show>
          </div>
        </SettingsSection>
      </div>
    </section>
  );
}
