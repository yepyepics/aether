import { createSignal } from "solid-js";

export type VideoContainerFormat = "mp4" | "mkv" | "webm";
export type AudioExtractFormat = "mp3" | "m4a" | "wav";

const VIDEO_FORMAT_KEY = "aether.defaultVideoFormat";
const AUDIO_FORMAT_KEY = "aether.defaultAudioFormat";

const VIDEO_FORMATS: VideoContainerFormat[] = ["mp4", "mkv", "webm"];
const AUDIO_FORMATS: AudioExtractFormat[] = ["mp3", "m4a", "wav"];

const [defaultVideoFormatSignal, setDefaultVideoFormatSignal] =
  createSignal<VideoContainerFormat>("mp4");
const [defaultAudioFormatSignal, setDefaultAudioFormatSignal] =
  createSignal<AudioExtractFormat>("mp3");

let initialized = false;

function isVideoFormat(value: string | null): value is VideoContainerFormat {
  return value !== null && VIDEO_FORMATS.includes(value as VideoContainerFormat);
}

function isAudioFormat(value: string | null): value is AudioExtractFormat {
  return value !== null && AUDIO_FORMATS.includes(value as AudioExtractFormat);
}

function persistPreference(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

export const defaultVideoFormat = defaultVideoFormatSignal;
export const defaultAudioFormat = defaultAudioFormatSignal;

export function initializePreferences() {
  if (initialized || typeof window === "undefined") return;

  const storedVideoFormat = window.localStorage.getItem(VIDEO_FORMAT_KEY);
  const storedAudioFormat = window.localStorage.getItem(AUDIO_FORMAT_KEY);

  setDefaultVideoFormatSignal(isVideoFormat(storedVideoFormat) ? storedVideoFormat : "mp4");
  setDefaultAudioFormatSignal(isAudioFormat(storedAudioFormat) ? storedAudioFormat : "mp3");

  initialized = true;
}

export function setDefaultVideoFormat(value: VideoContainerFormat) {
  setDefaultVideoFormatSignal(value);
  persistPreference(VIDEO_FORMAT_KEY, value);
}

export function setDefaultAudioFormat(value: AudioExtractFormat) {
  setDefaultAudioFormatSignal(value);
  persistPreference(AUDIO_FORMAT_KEY, value);
}

export function resetPreferencesForTests() {
  initialized = false;
  setDefaultVideoFormatSignal("mp4");
  setDefaultAudioFormatSignal("mp3");
}
