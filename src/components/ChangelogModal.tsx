import { Show, createSignal, onMount } from "solid-js";
import { consumePendingChangelog, type PendingChangelog } from "../lib/pendingChangelog";

export function ChangelogModal() {
  const [changelog, setChangelog] = createSignal<PendingChangelog | null>(null);

  onMount(() => {
    setChangelog(consumePendingChangelog());
  });

  return (
    <Show when={changelog()}>
      {(entry) => (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div class="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <h2 class="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Обновлено до версии v{entry().version}
            </h2>

            <div class="mt-4 max-h-60 overflow-y-auto rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950/60">
              <p class="whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {entry().notes || "Список изменений не был передан вместе с обновлением."}
              </p>
            </div>

            <button
              type="button"
              class="mt-6 w-full rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              onClick={() => setChangelog(null)}
            >
              Отлично, поехали!
            </button>
          </div>
        </div>
      )}
    </Show>
  );
}
