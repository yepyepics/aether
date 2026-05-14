import { createSignal } from "solid-js";

export type AppView = "home" | "settings";

const [currentViewSignal, setCurrentViewSignal] = createSignal<AppView>("home");

export const currentView = currentViewSignal;
export const setCurrentView = setCurrentViewSignal;

export function resetNavigationForTests() {
  setCurrentViewSignal("home");
}
