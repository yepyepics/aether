# Aether

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:08111f,50:1d4ed8,100:22d3ee&text=Aether&fontColor=ffffff&fontAlignY=38&desc=Elegant%20desktop%20downloads%20powered%20by%20yt-dlp&descAlignY=58&animation=fadeIn" alt="Aether header banner" />
</p>

<p align="center">
  <img src="app-icon.png" alt="Aether app icon" width="112" height="112" />
</p>

<p align="center">
  <strong>A polished desktop GUI for yt-dlp with a faster workflow, cleaner controls, and a more premium feel than the command line.</strong>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=IBM+Plex+Sans&weight=500&size=20&duration=4600&pause=1600&color=9FD7FF&center=true&vCenter=true&width=920&lines=Paste+a+link.+Choose+a+format.+Download+cleanly.;SponsorBlock%2C+Eco+Mode%2C+live+progress%2C+and+yt-dlp+updates.;Built+with+Tauri+2%2C+Rust%2C+SolidJS%2C+and+TypeScript." alt="Animated project summary" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.x-24C8DB?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/Rust-Backend-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust backend" />
  <img src="https://img.shields.io/badge/SolidJS-Frontend-2C4F7C?style=for-the-badge&logo=solid&logoColor=white" alt="SolidJS frontend" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

<p align="center">
  <a href="#why-aether">Why Aether</a> ·
  <a href="#feature-set">Feature Set</a> ·
  <a href="#development">Development</a> ·
  <a href="#contributing">Contributing</a>
</p>

## Why Aether

Aether is a desktop-first media downloader that wraps the flexibility of `yt-dlp` in a compact, modern interface. It is built for people who want reliable downloads, approachable controls, and a workflow that feels fast from the first paste to the finished file.

The project combines a Rust-powered Tauri shell with a lightweight SolidJS frontend, giving you low overhead, quick startup, and a UI that stays focused on the download experience instead of fighting it.

## Feature Set

| Area | What you get |
| --- | --- |
| Download flow | Download video or extract audio from one streamlined desktop screen. |
| Quality control | Pick video and audio formats quickly with simple presets and defaults. |
| Progress visibility | Track percent complete, speed, ETA, and current filename in real time. |
| SponsorBlock tools | Skip sponsor, intro, outro, self-promo, and interaction segments automatically. |
| Network control | Enable Eco Mode to reduce bandwidth pressure during longer downloads. |
| Update story | Keep the embedded `yt-dlp` binary fresh through the app lifecycle. |
| Localization | Switch between English and Russian with built-in language support. |

## Experience

<table>
  <tr>
    <td width="33%">
      <strong>Desktop-native feel</strong><br />
      Tauri keeps the app lean while Rust handles the heavier lifting behind the scenes.
    </td>
    <td width="33%">
      <strong>Focused UI</strong><br />
      Aether trims the command-line noise and leaves you with the choices that matter.
    </td>
    <td width="33%">
      <strong>Practical defaults</strong><br />
      The common path stays short, while power features remain close when you need them.
    </td>
  </tr>
</table>

## Tech Stack

```text
Desktop shell   Tauri 2
Backend         Rust
Frontend        SolidJS
Language        TypeScript
Styling         Tailwind CSS
Testing         Vitest
```

## Project Structure

```text
src/          SolidJS UI, state, localization, tests
src-tauri/    Rust backend, updater logic, sidecars, desktop bundling
public/       Static assets
```

## Development

### Prerequisites

- Node.js 18+
- pnpm
- Rust toolchain
- Tauri prerequisites for your platform

### Install dependencies

```bash
pnpm install
```

### Prepare local binaries

- Put the platform-specific `ffmpeg` sidecar into `src-tauri/bin/` before running `pnpm tauri dev`.
- Use the Tauri naming convention for your platform:
  - macOS Intel: `src-tauri/bin/ffmpeg-x86_64-apple-darwin`
  - macOS Apple Silicon: `src-tauri/bin/ffmpeg-aarch64-apple-darwin`
  - Linux x64: `src-tauri/bin/ffmpeg-x86_64-unknown-linux-gnu`
  - Windows x64: `src-tauri/bin/ffmpeg-x86_64-pc-windows-msvc.exe`
- If `ffmpeg` already exists globally, the Tauri build step can copy it from your system `PATH` into `src-tauri/bin/` for local builds.
- If the local sidecar is missing, the Rust backend falls back to a globally installed `ffmpeg` from your system `PATH`.

### Start the app

```bash
pnpm tauri dev
```

`pnpm tauri dev` and `pnpm tauri build` now sync the app version from the latest `v*` git tag before launching Tauri, so the UI version matches your tagged release line during local development too.

### Run tests

```bash
pnpm test
```

### Run type and formatting checks

```bash
pnpm lint
```

## Contributing

Contributions are welcome. For workflow expectations, branch naming, and pull request guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&section=footer&height=120&color=0:08111f,50:1d4ed8,100:22d3ee" alt="Aether footer banner" />
</p>
