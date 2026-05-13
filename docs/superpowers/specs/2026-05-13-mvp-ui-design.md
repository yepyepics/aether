# MVP UI Design — yt-dlgui Main Screen

## Overview

A single-window desktop app screen for yt-dlp GUI. The window uses layout variant B: a white card with a top bar, followed by a vertical flow of labeled sections. The design strictly follows `design.md` (Cal.com-inspired system).

**Window size:** ~400px wide, ~480px tall (content), centered on screen.

---

## Component: App Shell

A white card (`border: 1px solid #e5e7eb`, `border-radius: 12px`, `box-shadow: 0 4px 12px rgba(0,0,0,0.08)`) wrapping all content.

### Top Bar
- Height: 48px, `border-bottom: 1px solid #f3f4f6`, white background.
- Left: app name "yt-dlgui" — `title-sm` (Inter 14px/600, `#111111`, `letter-spacing: -0.3px`).
- Right: version badge (`badge-pill` style: `#f5f5f5` bg, `#6b7280` text, `border-radius: 9999px`, `font-size: 12px`) + settings icon (⚙, `#6b7280`).

---

## Component: URL Section

Label: uppercase caption (`font-size: 11px`, `font-weight: 600`, `color: #374151`, `letter-spacing: 0.4px`), text "ССЫЛКА".

Input row (`text-input` style): white bg, `1px solid #e5e7eb` border, `border-radius: 8px`, height 40px, `padding: 0 12px`.
- Left: placeholder text "Вставьте ссылку на видео…" in `color: #898989`, `font-size: 13px`.
- Right: "Вставить" button-text-link — `font-size: 12px`, `font-weight: 600`, `color: #111111`, separated by `1px solid #e5e7eb` left border.

---

## Component: Format + Quality Row

Two columns in a `grid-template-columns: 1fr 1fr` grid, `gap: 12px`.

Each column has an uppercase caption label above a `nav-pill-group`:
- Pill group: `background: #f8f9fa`, `border-radius: 9999px`, `padding: 4px`, `display: inline-flex`.
- Active pill: `background: #111111`, `color: #ffffff`, `border-radius: 9999px`, `padding: 5px 14px`, `font-size: 12px`, `font-weight: 600`.
- Inactive pill: `color: #6b7280`, same padding, no background.

**Format pills:** "Видео" (default active) | "Аудио"
**Quality pills:** "1080p" (default active) | "720p" | "480p"

Quality section is hidden when "Аудио" is selected (audio has no resolution choice).

---

## Component: Folder Path Row

Label: uppercase caption, text "ПАПКА СОХРАНЕНИЯ".

Row: `background: #f5f5f5`, `border-radius: 8px`, height 40px, `padding: 0 14px`. Displays current path (`#374151`, `font-size: 13px`) + "Изменить →" link (`color: #3b82f6`, `font-size: 12px`, `font-weight: 600`) aligned right.

On click: triggers native folder dialog (`@tauri-apps/plugin-dialog`).

---

## Component: Download Button (idle state)

`button-primary`: `background: #111111`, `color: #ffffff`, `border-radius: 8px`, height 40px, full width, `font-size: 14px`, `font-weight: 600`, text "Скачать".

Disabled state: `background: #e5e7eb`, `color: #6b7280` — active when URL field is empty.

---

## Downloading State (replaces bottom section)

When download starts, the folder row and download button are replaced by:

**Progress card** (`surface-card`: `background: #f5f5f5`, `border-radius: 12px`, `padding: 16px`):
- Top row: "Загрузка…" label (`font-size: 13px`, `font-weight: 600`, `color: #111111`) + percentage right-aligned.
- Progress bar: `background: #e5e7eb` track, `background: #111111` fill, `border-radius: 9999px`, height 6px.
- Bottom row: speed left (`#6b7280`, `font-size: 12px`) + ETA right.

**Cancel button** (`button-secondary`): white bg, `1px solid #e5e7eb` border, `border-radius: 8px`, height 40px, full width, text "Отменить".

Format/Quality controls: `opacity: 0.5`, `pointer-events: none` (locked during download).

---

## States Summary

| State | URL field | Controls | Bottom area |
|---|---|---|---|
| Idle, empty URL | Empty | Enabled | Download button (disabled) |
| Idle, URL filled | Filled | Enabled | Download button (active) |
| Downloading | Filled (read-only) | Locked (0.5 opacity) | Progress card + Cancel button |
| Done | Cleared | Enabled | Download button (disabled) |

---

## File Structure

```
src/
├── App.tsx              — root, renders <MainScreen />
├── components/
│   ├── MainScreen.tsx   — top-level layout shell
│   ├── TopBar.tsx       — app name + version badge + settings icon
│   ├── UrlInput.tsx     — URL text input + Paste button
│   ├── PillGroup.tsx    — reusable nav-pill-group (Format, Quality)
│   ├── FolderRow.tsx    — path display + folder dialog trigger
│   ├── DownloadButton.tsx
│   └── ProgressCard.tsx — progress bar + speed + ETA + Cancel
└── index.css            — @theme tokens (already configured)
```

---

## SolidJS Signals

```ts
const [url, setUrl] = createSignal("");
const [format, setFormat] = createSignal<"video" | "audio">("video");
const [quality, setQuality] = createSignal<"1080" | "720" | "480">("1080");
const [outputDir, setOutputDir] = createSignal("~/Downloads");
const [isDownloading, setIsDownloading] = createSignal(false);
const [progress, setProgress] = createSignal({ pct: 0, speed: "", eta: "" });
```

No stores needed at MVP scope — signals suffice. All signals live in `MainScreen.tsx` and are passed as props.

---

## Out of Scope (this spec)

- Rust/yt-dlp command execution (next phase).
- Settings panel (behind ⚙ icon).
- Toast/notification on download complete.
- Playlist support, queue, metadata embedding.
