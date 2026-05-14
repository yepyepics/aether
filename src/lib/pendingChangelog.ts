export const PENDING_CHANGELOG_STORAGE_KEY = "aether_pending_changelog";

export type PendingChangelog = {
  version: string;
  notes: string;
};

export function savePendingChangelog(update: { version: string; body?: string | null }) {
  window.localStorage.setItem(
    PENDING_CHANGELOG_STORAGE_KEY,
    JSON.stringify({ version: update.version, notes: update.body ?? "" })
  );
}

export function consumePendingChangelog(): PendingChangelog | null {
  const rawChangelog = window.localStorage.getItem(PENDING_CHANGELOG_STORAGE_KEY);
  if (!rawChangelog) return null;

  window.localStorage.removeItem(PENDING_CHANGELOG_STORAGE_KEY);

  try {
    const parsed = JSON.parse(rawChangelog) as Partial<PendingChangelog>;
    if (typeof parsed.version !== "string") {
      return null;
    }

    return {
      version: parsed.version,
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
    };
  } catch {
    return null;
  }
}
