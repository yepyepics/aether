# SponsorBlock Integration — Design Spec

**Date:** 2026-05-14  
**Status:** Approved

---

## Overview

Add a toggle to the download UI that enables automatic removal of sponsor segments, intros, outros, self-promotion, and interaction reminders from downloaded videos using yt-dlp's built-in SponsorBlock API support.

---

## Scope

- One new boolean signal in `MainScreen.tsx`
- One toggle row UI component (inline, no new file)
- One new `bool` parameter in the `start_download` Tauri command (`lib.rs`)
- No changes to the progress parser or event system

---

## Frontend (`src/components/MainScreen.tsx`)

### New state

```ts
const [isSponsorBlockEnabled, setIsSponsorBlockEnabled] = createSignal(false);
```

### QueueItem extension

Add `sponsorBlock: boolean` to the `QueueItem` interface so queued downloads preserve the toggle state at time of queuing:

```ts
interface QueueItem {
  url: string;
  outputDir: string;
  format: Format;
  quality: Quality;
  sponsorBlock: boolean;
}
```

### Toggle row placement

Between the format/quality `<div>` block and the `Show` block that renders `FolderRow` + `DownloadButton`. Inserted as a standalone `<div>` inside the main `gap: 16px` flex column.

### Toggle row design

- Layout: `display: flex`, `align-items: center`, `justify-content: space-between`
- Label: Inter 13px / weight 500, color `#374151`
- Toggle track: 36×20px, border-radius 9999px
  - Off: background `#e5e7eb`
  - On: background `#111111`
  - Transition: `background-color 0.15s ease`
- Toggle thumb: 16×16px white circle, border-radius 50%
  - Off: `transform: translateX(2px)`
  - On: `transform: translateX(18px)`
  - Transition: `transform 0.15s ease`
- Disabled state (during download): `opacity: 0.5`, `pointer-events: none`

The toggle is implemented as a `<button role="switch">` (no native checkbox) with `aria-checked={isSponsorBlockEnabled()}` for accessibility.

### Download invocation

`invoke("start_download", {...})` gains `sponsorblock: isSponsorBlockEnabled()`.

`startDownload(item?)` reads `item?.sponsorBlock ?? isSponsorBlockEnabled()`.

`handleDownloadClick` includes `sponsorBlock: isSponsorBlockEnabled()` when pushing to queue.

---

## Backend (`src-tauri/src/lib.rs`)

### Command signature change

```rust
#[tauri::command]
async fn start_download(
    app: AppHandle,
    url: String,
    output_dir: String,
    format: String,
    quality: String,
    sponsorblock: bool,
) -> Result<(), String>
```

### Argument injection

Inserted after the format/quality args block, before the `--newline` / `-o` / url block:

```rust
if sponsorblock {
    args.push("--sponsorblock-remove".into());
    args.push("sponsor,intro,outro,selfpromo,interaction".into());
}
```

SponsorBlock categories used:
| Category | Meaning |
|---|---|
| `sponsor` | Paid/unpaid sponsorship segments |
| `intro` | Intro/opening animation |
| `outro` | Outro/end card |
| `selfpromo` | Non-paid self-promotion |
| `interaction` | Requests for likes/subs/follows |

---

## Progress Parser

No changes required. The existing regex matches only lines of the form:

```
[download]  42.3% of 120.00MiB at 2.50MiB/s ETA 00:30
```

SponsorBlock output lines (e.g. `[SponsorBlock] Removing segment ...`) do not match this pattern and are silently ignored by the frontend listener.

---

## Out of Scope

- No user-configurable category selection (always use the five categories above)
- No persistence of the toggle state between app launches
- No visual indicator during SponsorBlock processing (yt-dlp handles it silently after download)

---

## Files Changed

| File | Change |
|---|---|
| `src/components/MainScreen.tsx` | New signal, extended QueueItem, toggle row UI, updated invoke call |
| `src-tauri/src/lib.rs` | New `sponsorblock: bool` param, conditional arg injection |
