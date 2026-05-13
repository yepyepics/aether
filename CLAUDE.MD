# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: yt-dlp GUI Downloader

A cross-platform (macOS & Windows) desktop GUI for `yt-dlp`. Priority: minimal RAM, tiny bundle, responsive UI that never freezes during downloads.

**Stack:** Tauri v2 · Rust · SolidJS + TypeScript · Tailwind CSS

## Commands

```bash
# Install dependencies
pnpm install

# Start dev server (hot-reload frontend + Rust backend)
pnpm tauri dev

# Production build
pnpm tauri build

# Frontend only (Vite)
pnpm dev

# Type check
pnpm tsc --noEmit

# Lint
pnpm eslint src
```

## Architecture

### Sidecar Pattern (critical)
- **No Python.** `yt-dlp` runs as a pre-compiled binary bundled via Tauri's Sidecar feature (`@tauri-apps/plugin-shell`).
- Sidecar binaries live in `src-tauri/binaries/` — one per target triple (e.g. `yt-dlp-x86_64-apple-darwin`, `yt-dlp-x86_64-pc-windows-msvc.exe`).
- Binary names must match the `externalBin` entries in `tauri.conf.json`.

### Data Flow
1. **Frontend (SolidJS)** — user configures URL, format, quality, output path → calls Tauri command.
2. **Rust command handler** — spawns sidecar with args, streams `stdout`/`stderr` lines back to frontend via `app.emit()`.
3. **Frontend listener** — `listen()` from `@tauri-apps/api/event` receives progress lines; SolidJS signals parse and display them without Virtual DOM overhead.

### Progress Parsing
`yt-dlp` stdout format: `[download]  42.3% of 120.00MiB at 2.50MiB/s ETA 00:30`
Parse with a regex in the frontend signal to extract: percentage, speed, ETA.

### yt-dlp Auto-Updater (distinct from Tauri app updates)
- A Rust command fetches the latest release JSON from `https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest`.
- Downloads the correct binary for the running OS/arch.
- Writes to the app's local data dir (not the bundle) so it survives app updates without requiring re-signing.
- On next launch (or immediately after update), the Rust side checks the local data dir first; falls back to the bundled binary.

### Key yt-dlp Flags
| Feature | Flag |
|---|---|
| Best video + audio | `bestvideo+bestaudio` (default merge) |
| Audio-only MP3 | `-x --audio-format mp3 --audio-quality 0` |
| Max resolution | `-f bestvideo[height<=1080]+bestaudio` |
| Output path | `-o "/path/%(title)s.%(ext)s"` |

## Design System

**Always read `DESIGN.md` before touching UI.** Do not invent styles.

Key rules:
- Colors: near-black primary `#111111`, white canvas `#ffffff`, light-gray cards `#f5f5f5`.
- Typography: Cal Sans (weight 600, negative tracking) for headlines; Inter for everything else.
- Border radius: `8px` buttons/inputs · `12px` content cards · `16px` hero container · `9999px` pills/avatars.
- Section vertical rhythm: `96px`.
- Dark surface (`#101010`) used only for the footer and featured pricing tier — nowhere else.

## MVP Features

1. Format: Video (best+merge) or Audio (MP3, quality 0).
2. Quality: 1080p / 720p / 480p via `[height<=X]`.
3. Path picker: `@tauri-apps/plugin-dialog` → native folder dialog → sets `-o` flag.
4. Live progress: parse `stdout` → percentage + speed + ETA signals.

## Future Roadmap (design for extensibility)
- Download queue / Task Manager.
- Metadata + thumbnail embedding.
- Playlist support with multi-selection.
- Browser extension integration.
