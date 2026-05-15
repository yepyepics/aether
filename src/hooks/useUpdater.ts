import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { createSignal } from "solid-js";
import { savePendingChangelog } from "../lib/pendingChangelog";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "up_to_date"
  | "update_available"
  | "installing";

const AUTO_UPDATE_STORAGE_KEY = "aether.autoUpdateEnabled";

const [isAutoUpdateEnabledSignal, setIsAutoUpdateEnabledSignal] = createSignal(true);
const [appVersionSignal, setAppVersionSignal] = createSignal("");
const [updateStatusSignal, setUpdateStatusSignal] = createSignal<UpdateStatus>("idle");
const [availableUpdateSignal, setAvailableUpdateSignal] = createSignal<Update | null>(null);
const [updateErrorSignal, setUpdateErrorSignal] = createSignal("");

let preferencesInitialized = false;
let versionLoaded = false;
let startupCheckStarted = false;

function readStoredAutoUpdatePreference() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(AUTO_UPDATE_STORAGE_KEY) !== "false";
}

function persistAutoUpdatePreference(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTO_UPDATE_STORAGE_KEY, String(value));
}

function formatUpdaterError(error: unknown) {
  const message = typeof error === "string"
    ? error
    : error instanceof Error
      ? error.message
      : "";

  if (
    message.includes("pubkey") ||
    message.includes("endpoint") ||
    message.includes("EmptyEndpoints") ||
    message.includes("updater capability") ||
    message.includes("not allowed") ||
    message.includes("plugin")
  ) {
    return "unavailable";
  }

  return "generic";
}

async function loadAppVersion() {
  if (versionLoaded) return;
  versionLoaded = true;

  try {
    setAppVersionSignal(await getVersion());
  } catch {
    setAppVersionSignal("");
  }
}

export function initializeUpdater(options?: { checkOnLaunch?: boolean }) {
  if (!preferencesInitialized) {
    setIsAutoUpdateEnabledSignal(readStoredAutoUpdatePreference());
    preferencesInitialized = true;
  }

  void loadAppVersion();

  if (
    options?.checkOnLaunch &&
    !startupCheckStarted &&
    isAutoUpdateEnabledSignal()
  ) {
    startupCheckStarted = true;
    void checkForUpdates({ suppressUpToDateState: true });
  }
}

export function setIsAutoUpdateEnabled(value: boolean) {
  setIsAutoUpdateEnabledSignal(value);
  persistAutoUpdatePreference(value);
}

export async function checkForUpdates(options?: { suppressUpToDateState?: boolean }) {
  setUpdateErrorSignal("");
  setUpdateStatusSignal("checking");

  try {
    const update = await check();
    setAvailableUpdateSignal(update);

    if (update) {
      setUpdateStatusSignal("update_available");
      return update;
    }

    setUpdateStatusSignal(options?.suppressUpToDateState ? "idle" : "up_to_date");
    return null;
  } catch (error) {
    setAvailableUpdateSignal(null);
    setUpdateStatusSignal("idle");
    setUpdateErrorSignal(formatUpdaterError(error));
    return null;
  }
}

export async function installUpdate() {
  const update = availableUpdateSignal();
  if (!update) return;

  setUpdateErrorSignal("");
  setUpdateStatusSignal("installing");

  try {
    await update.downloadAndInstall();
    savePendingChangelog({ version: update.version, body: update.body });
    await relaunch();
  } catch (error) {
    setUpdateStatusSignal("update_available");
    setUpdateErrorSignal(formatUpdaterError(error));
  }
}

export function useUpdater() {
  return {
    appVersion: appVersionSignal,
    availableUpdate: availableUpdateSignal,
    checkForUpdates,
    initializeUpdater,
    installUpdate,
    isAutoUpdateEnabled: isAutoUpdateEnabledSignal,
    setIsAutoUpdateEnabled,
    updateError: updateErrorSignal,
    updateStatus: updateStatusSignal,
  };
}

export function resetUpdaterForTests() {
  preferencesInitialized = false;
  versionLoaded = false;
  startupCheckStarted = false;
  setIsAutoUpdateEnabledSignal(true);
  setAppVersionSignal("");
  setUpdateStatusSignal("idle");
  setAvailableUpdateSignal(null);
  setUpdateErrorSignal("");
}
