# Aether

<p align="center">
  <img src="src-tauri/icons/128x128.png" alt="Aether app icon" width="96" height="96" />
</p>

<p align="center">
  <strong>A polished desktop GUI for yt-dlp, built for speed, clarity, and a smooth download workflow.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.x-24C8DB?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/Rust-Backend-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust backend" />
  <img src="https://img.shields.io/badge/SolidJS-Frontend-2C4F7C?style=for-the-badge&logo=solid&logoColor=white" alt="SolidJS frontend" />
  <img src="https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

## Overview

Aether is a desktop-first media downloader that wraps the power of `yt-dlp` in a compact, modern interface. It is designed for people who want the reliability and flexibility of the command line without sacrificing speed, usability, or visual polish.

The app combines a Rust-powered Tauri shell with a lightweight SolidJS frontend, resulting in a fast startup, low overhead, and a workflow that stays focused on one thing: getting downloads done cleanly.

## Highlights

- Download video or extract audio from a single streamlined desktop flow.
- Choose quality presets quickly with simple, approachable controls.
- Remove sponsor, intro, outro, self-promo, and interaction segments via SponsorBlock.
- Enable Eco Mode to cap bandwidth usage for more controlled downloads.
- Track live progress with percentage, transfer speed, ETA, and current file name.
- Queue downloads while the embedded `yt-dlp` engine is updating.
- Set default output formats for both video and audio in the settings screen.
- Switch between English and Russian with built-in localization support.
- Receive automatic `yt-dlp` binary updates through the desktop app lifecycle.

## Why Aether

- Professional desktop UX instead of a raw command surface.
- Lightweight architecture powered by Tauri and Rust.
- Clear visual hierarchy with minimal friction between paste and download.
- Practical defaults for everyday media downloading tasks.

## Tech Stack

- Tauri 2
- Rust
- SolidJS
- TypeScript
- Tailwind CSS
- Vitest

## Project Structure

```text
src/          SolidJS UI, state, localization, tests
src-tauri/    Rust backend, updater logic, desktop bundling
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

### Start the desktop app

```bash
pnpm tauri dev
```

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
