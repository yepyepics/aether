import { For, onMount } from "solid-js";
import {
  defaultAudioFormat,
  defaultVideoFormat,
  initializePreferences,
  setDefaultAudioFormat,
  setDefaultVideoFormat,
  type AudioExtractFormat,
  type VideoContainerFormat,
} from "../stores/preferencesStore";
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

export function SettingsScreen() {
  onMount(() => {
    initializePreferences();
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
      </div>
    </section>
  );
}
