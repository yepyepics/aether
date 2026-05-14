import { Show, onMount } from "solid-js";
import { MainScreen } from "./components/MainScreen";
import { ChangelogModal } from "./components/ChangelogModal";
import { SettingsScreen } from "./components/SettingsScreen";
import { initializeI18n } from "./store/i18n";
import { currentView } from "./stores/navigationStore";
import { initializePreferences } from "./stores/preferencesStore";

function App() {
  onMount(() => {
    initializeI18n();
    initializePreferences();
  });

  return (
    <main class="app-noise h-screen w-screen overflow-hidden">
      <div class="relative h-full w-full min-h-0 min-w-0">
        <div
          class={`absolute inset-0 z-10 ${currentView() === "settings" ? "pointer-events-none" : ""}`}
        >
          <MainScreen />
        </div>

        <Show when={currentView() === "settings"}>
          <div class="absolute inset-0 z-20">
            <SettingsScreen />
          </div>
        </Show>

        <ChangelogModal />
      </div>
    </main>
  );
}

export default App;
