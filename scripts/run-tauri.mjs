import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const nodeExecutable = process.execPath;
const syncScriptPath = path.join(repoRoot, "scripts", "sync-version.mjs");
const tauriCliPath = path.join(repoRoot, "node_modules", "@tauri-apps", "cli", "tauri.js");
const tauriArgs = process.argv.slice(2);

const syncResult = spawnSync(nodeExecutable, [syncScriptPath], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (syncResult.status !== 0) {
  process.exit(syncResult.status ?? 1);
}

const tauriResult = spawnSync(nodeExecutable, [tauriCliPath, ...tauriArgs], {
  cwd: repoRoot,
  stdio: "inherit",
});

process.exit(tauriResult.status ?? 1);
