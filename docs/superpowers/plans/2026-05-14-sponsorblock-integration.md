# SponsorBlock Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a SponsorBlock toggle to the download UI that passes `--sponsorblock-remove sponsor,intro,outro,selfpromo,interaction` to yt-dlp when enabled.

**Architecture:** One new `bool` signal in `MainScreen.tsx` feeds a custom toggle row; its value is forwarded to the Rust `start_download` command which conditionally appends the SponsorBlock flags before spawning yt-dlp.

**Tech Stack:** SolidJS + TypeScript (frontend), Rust / Tauri v2 (backend), Vitest + @solidjs/testing-library (tests)

---

## File Map

| File | Change |
|---|---|
| `src/components/MainScreen.tsx` | Add signal, extend `QueueItem`, add toggle row, pass param to `invoke` |
| `src-tauri/src/lib.rs` | Add `sponsorblock: bool` param to `start_download`, inject args conditionally |
| `src/components/MainScreen.test.tsx` | Add toggle behaviour tests |

---

## Task 1: Backend — add `sponsorblock` param to `start_download`

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add `sponsorblock: bool` to command signature**

Open `src-tauri/src/lib.rs`. Replace the `start_download` function signature (lines 23-29):

```rust
#[tauri::command]
async fn start_download(
    app: AppHandle,
    url: String,
    output_dir: String,
    format: String,  // "video" | "audio"
    quality: String, // "1080" | "720" | "480"
    sponsorblock: bool,
) -> Result<(), String> {
```

- [ ] **Step 2: Inject SponsorBlock args after format/quality block, before `--newline`**

In the same function body, insert the conditional block immediately after the closing `}` of the `if format == "audio" { ... } else { ... }` block, before the `args.extend([...])` call with `--newline`:

```rust
    if sponsorblock {
        args.push("--sponsorblock-remove".into());
        args.push("sponsor,intro,outro,selfpromo,interaction".into());
    }

    args.extend([
        "--newline".into(),
        "-o".into(),
        format!("{}/%(title)s.%(ext)s", output_dir),
        url,
    ]);
```

- [ ] **Step 3: Verify the project compiles**

Run:
```bash
cd src-tauri && cargo check
```
Expected: no errors. If `error[E0061]` appears (wrong number of args), make sure the `invoke_handler` in `pub fn run()` still only lists `start_download` — no changes needed there.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(backend): add sponsorblock param to start_download command"
```

---

## Task 2: Frontend — write failing tests for the toggle

**Files:**
- Modify: `src/components/MainScreen.test.tsx`

- [ ] **Step 1: Add toggle tests at the end of the `describe` block**

Append these three tests inside the existing `describe("MainScreen", () => { ... })` in `src/components/MainScreen.test.tsx`:

```ts
  it("renders SponsorBlock toggle unchecked by default", () => {
    const { getByRole } = render(() => <MainScreen />);
    const toggle = getByRole("switch", { name: /вырезать/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("toggles SponsorBlock on click", () => {
    const { getByRole } = render(() => <MainScreen />);
    const toggle = getByRole("switch", { name: /вырезать/i });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("SponsorBlock toggle is disabled while downloading", () => {
    const { getByPlaceholderText, getByRole } = render(() => <MainScreen />);
    fireEvent.input(getByPlaceholderText("Вставьте ссылку на видео…"), {
      target: { value: "https://youtube.com/watch?v=test" },
    });
    fireEvent.click(getByRole("button", { name: "Скачать" }));
    const toggle = getByRole("switch", { name: /вырезать/i });
    expect(toggle).toBeDisabled();
  });
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pnpm test
```
Expected: 3 new failures — `Unable to find role="switch"`.

---

## Task 3: Frontend — add signal and toggle row to `MainScreen.tsx`

**Files:**
- Modify: `src/components/MainScreen.tsx`

- [ ] **Step 1: Add `isSponsorBlockEnabled` signal**

After the existing `const [downloadQueue, ...] = createSignal<QueueItem[]>([]);` line, add:

```ts
  const [isSponsorBlockEnabled, setIsSponsorBlockEnabled] = createSignal(false);
```

- [ ] **Step 2: Extend `QueueItem` interface**

Change the `QueueItem` interface (before `MainScreen` function) to:

```ts
interface QueueItem {
  url: string;
  outputDir: string;
  format: Format;
  quality: Quality;
  sponsorBlock: boolean;
}
```

- [ ] **Step 3: Update `startDownload` to read `sponsorBlock` from item or signal**

In `startDownload`, add `dlSponsorBlock` after the existing `dlQuality` line:

```ts
    const dlSponsorBlock = item?.sponsorBlock ?? isSponsorBlockEnabled();
```

- [ ] **Step 4: Update `invoke` call to pass `sponsorblock`**

Change the `invoke(...)` call to:

```ts
    invoke("start_download", {
      url: dlUrl,
      outputDir: dlDir,
      format: dlFormat,
      quality: dlQuality,
      sponsorblock: dlSponsorBlock,
    }).catch(() => {
      setIsDownloading(false);
      cleanupDownload();
    });
```

- [ ] **Step 5: Update `handleDownloadClick` to capture toggle state in queue**

In `handleDownloadClick`, update the object pushed to `downloadQueue`:

```ts
      setDownloadQueue(q => [
        ...q,
        {
          url: url(),
          outputDir: outputDir(),
          format: format(),
          quality: quality(),
          sponsorBlock: isSponsorBlockEnabled(),
        },
      ]);
```

- [ ] **Step 6: Add the toggle row to the JSX**

Find the `<div style={{ padding: "20px", display: "flex", "flex-direction": "column", gap: "16px" }}>` block. Inside it, insert the toggle row **between** the format/quality grid `<div>` and the `<Show when={isDownloading()} ...>` block:

```tsx
          {/* SponsorBlock toggle */}
          <div
            style={{
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
              opacity: isDownloading() ? "0.5" : "1",
              "pointer-events": isDownloading() ? "none" : "auto",
            }}
          >
            <span
              class="font-sans"
              style={{ "font-size": "13px", "font-weight": "500", color: "#374151" }}
            >
              Вырезать рекламу (SponsorBlock)
            </span>
            <button
              role="switch"
              aria-checked={isSponsorBlockEnabled()}
              aria-label="Вырезать рекламу (SponsorBlock)"
              disabled={isDownloading()}
              onClick={() => setIsSponsorBlockEnabled(v => !v)}
              style={{
                position: "relative",
                width: "36px",
                height: "20px",
                "border-radius": "9999px",
                border: "none",
                cursor: "pointer",
                padding: "0",
                "background-color": isSponsorBlockEnabled() ? "#111111" : "#e5e7eb",
                transition: "background-color 0.15s ease",
                "flex-shrink": "0",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: "2px",
                  width: "16px",
                  height: "16px",
                  "border-radius": "50%",
                  "background-color": "#ffffff",
                  transition: "transform 0.15s ease",
                  transform: isSponsorBlockEnabled() ? "translateX(16px)" : "translateX(0)",
                }}
              />
            </button>
          </div>
```

- [ ] **Step 7: Run tests to confirm they now pass**

```bash
pnpm test
```
Expected: all tests pass (previously failing 3 tests now green, existing 6 tests still green).

- [ ] **Step 8: Commit**

```bash
git add src/components/MainScreen.tsx src/components/MainScreen.test.tsx
git commit -m "feat(frontend): add SponsorBlock toggle to download UI"
```

---

## Self-Review

**Spec coverage:**
- ✅ `isSponsorBlockEnabled` signal — Task 3 Step 1
- ✅ Toggle UI between format/quality and folder row — Task 3 Step 6
- ✅ Toggle disabled during download — Task 3 Step 6 (opacity + pointer-events + `disabled`)
- ✅ `sponsorblock` bool passed to `invoke` — Task 3 Step 4
- ✅ `QueueItem` extended with `sponsorBlock` — Task 3 Step 2
- ✅ Rust param `sponsorblock: bool` — Task 1 Step 1
- ✅ `--sponsorblock-remove sponsor,intro,outro,selfpromo,interaction` injected — Task 1 Step 2
- ✅ Progress parser unchanged — no task needed (existing regex unaffected)
- ✅ Toggle tests — Task 2

**Placeholder scan:** No TBD, no "implement later", no vague steps. All code is complete.

**Type consistency:**
- `sponsorBlock` (camelCase) in TypeScript `QueueItem` ✅
- `sponsorblock` (snake_case) in `invoke(...)` payload — Tauri serialises camelCase → snake_case automatically ✅
- `sponsorblock: bool` in Rust command signature ✅
- `dlSponsorBlock` read from `item?.sponsorBlock ?? isSponsorBlockEnabled()` ✅
