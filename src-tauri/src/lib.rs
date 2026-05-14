use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

mod updater;

#[derive(Clone, serde::Serialize)]
struct LinePayload {
    line: String,
}

fn ffmpeg_binary_name() -> &'static str {
    if cfg!(windows) {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    }
}

fn ffmpeg_sidecar_name() -> String {
    let suffix = if cfg!(target_os = "windows") {
        "x86_64-pc-windows-msvc.exe"
    } else if cfg!(all(target_os = "macos", target_arch = "aarch64")) {
        "aarch64-apple-darwin"
    } else if cfg!(target_os = "macos") {
        "x86_64-apple-darwin"
    } else {
        "x86_64-unknown-linux-gnu"
    };

    format!("ffmpeg-{suffix}")
}

fn existing_path(path: PathBuf) -> Option<PathBuf> {
    if path.is_file() {
        std::fs::canonicalize(&path).ok().or(Some(path))
    } else {
        None
    }
}

fn find_ffmpeg_in_path() -> Option<PathBuf> {
    std::env::var_os("PATH")
        .map(|paths| {
            std::env::split_paths(&paths)
                .find_map(|dir| existing_path(dir.join(ffmpeg_binary_name())))
        })
        .flatten()
}

fn bundled_ffmpeg_path(app: &AppHandle) -> Option<PathBuf> {
    let sidecar_name = ffmpeg_sidecar_name();
    let mut candidates = Vec::new();

    if let Ok(resource_dir) = app.path().resource_dir() {
        candidates.push(resource_dir.join(&sidecar_name));
        candidates.push(resource_dir.join("bin").join(&sidecar_name));
    }

    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(parent) = current_exe.parent() {
            candidates.push(parent.join(&sidecar_name));
            candidates.push(parent.join("resources").join(&sidecar_name));
            candidates.push(parent.join("resources").join("bin").join(&sidecar_name));
        }
    }

    candidates.push(
        PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .join("bin")
            .join(&sidecar_name),
    );

    candidates.into_iter().find_map(existing_path)
}

fn resolve_ffmpeg_location(app: &AppHandle) -> Option<PathBuf> {
    bundled_ffmpeg_path(app).or_else(find_ffmpeg_in_path)
}

fn build_download_args(
    url: String,
    output_dir: String,
    format: String,
    quality: String,
    eco_mode: bool,
    sponsorblock: bool,
    video_format: String,
    audio_format: String,
    ffmpeg_location: Option<&Path>,
) -> Vec<String> {
    let mut args: Vec<String> = Vec::new();

    if format == "audio" {
        args.extend([
            "-x".into(),
            "--audio-format".into(),
            audio_format,
            "--audio-quality".into(),
            "0".into(),
        ]);
    } else {
        args.push("-f".into());
        args.push(match quality.as_str() {
            "720" => "bestvideo[height<=720]+bestaudio/best[height<=720]".into(),
            "480" => "bestvideo[height<=480]+bestaudio/best[height<=480]".into(),
            _ => "bestvideo+bestaudio/best".into(),
        });
        args.push("--merge-output-format".into());
        args.push("mkv".into());

        if video_format != "mkv" {
            args.push("--remux-video".into());
            args.push(video_format);
        }
    }

    if sponsorblock {
        args.push("--sponsorblock-remove".into());
        args.push("sponsor,intro,outro,selfpromo,interaction".into());
    }

    if eco_mode {
        args.push("--limit-rate".into());
        args.push("5M".into());
    }

    if let Some(ffmpeg_location) = ffmpeg_location {
        args.push("--ffmpeg-location".into());
        args.push(ffmpeg_location.to_string_lossy().into_owned());
    }

    args.extend([
        "--clean-infojson".into(),
        "--rm-cache-dir".into(),
        "--newline".into(),
        "-o".into(),
        format!("{}/%(title)s.%(ext)s", output_dir),
        url,
    ]);

    args
}

/// Запускает yt-dlp и транслирует stdout/stderr во фронтенд через Tauri Events.
///
/// Если в app_local_data_dir есть обновлённый бинарник — использует его.
/// Иначе — sidecar из бандла.
///
/// События:
///   "ytdlp-stdout" — строка прогресса / лог
///   "ytdlp-stderr" — строка ошибки
///   "ytdlp-done"   — процесс завершён, payload: Option<i32> (exit code)
#[tauri::command]
async fn start_download(
    app: AppHandle,
    url: String,
    output_dir: String,
    format: String,  // "video" | "audio"
    quality: String, // "1080" | "720" | "480"
    eco_mode: bool,
    sponsorblock: bool,
    video_format: String,
    audio_format: String,
) -> Result<(), String> {
    let ffmpeg_location = resolve_ffmpeg_location(&app);
    if format == "video" && ffmpeg_location.is_none() {
        return Err("missing_ffmpeg_for_video_format".into());
    }

    let args = build_download_args(
        url,
        output_dir,
        format,
        quality,
        eco_mode,
        sponsorblock,
        video_format,
        audio_format,
        ffmpeg_location.as_deref(),
    );

    if let Some(local_bin) = updater::local_bin_path(&app) {
        run_local(app, local_bin, args).await
    } else {
        run_sidecar(app, args).await
    }
}

async fn run_sidecar(app: AppHandle, args: Vec<String>) -> Result<(), String> {
    let (mut rx, _child) = app
        .shell()
        .sidecar("yt-dlp")
        .map_err(|e| e.to_string())?
        .args(&args)
        .spawn()
        .map_err(|e| e.to_string())?;

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(bytes) => {
                let line = String::from_utf8_lossy(&bytes).to_string();
                app.emit("ytdlp-stdout", LinePayload { line })
                    .map_err(|e| e.to_string())?;
            }
            CommandEvent::Stderr(bytes) => {
                let line = String::from_utf8_lossy(&bytes).to_string();
                app.emit("ytdlp-stderr", LinePayload { line })
                    .map_err(|e| e.to_string())?;
            }
            CommandEvent::Terminated(payload) => {
                app.emit("ytdlp-done", payload.code)
                    .map_err(|e| e.to_string())?;
                break;
            }
            _ => {}
        }
    }

    Ok(())
}

/// Uses the locally-updated binary via tokio::process (bypasses Tauri shell scope).
async fn run_local(app: AppHandle, bin: PathBuf, args: Vec<String>) -> Result<(), String> {
    use tokio::io::{AsyncBufReadExt, BufReader};

    let mut child = tokio::process::Command::new(&bin)
        .args(&args)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    let stdout = child.stdout.take().ok_or("no stdout")?;
    let stderr = child.stderr.take().ok_or("no stderr")?;

    let app_err = app.clone();
    tokio::spawn(async move {
        let mut lines = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let _ = app_err.emit("ytdlp-stderr", LinePayload { line });
        }
    });

    let mut lines = BufReader::new(stdout).lines();
    while let Ok(Some(line)) = lines.next_line().await {
        app.emit("ytdlp-stdout", LinePayload { line })
            .map_err(|e| e.to_string())?;
    }

    let status = child.wait().await.map_err(|e| e.to_string())?;
    app.emit("ytdlp-done", status.code())
        .map_err(|e| e.to_string())?;

    Ok(())
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(updater::check_and_update(handle));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![start_download])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::{build_download_args, find_ffmpeg_in_path};
    use std::path::Path;

    #[test]
    fn video_download_merges_to_mkv_and_remuxes_when_needed() {
        let args = build_download_args(
            "https://example.com/watch?v=test".into(),
            "/tmp/downloads".into(),
            "video".into(),
            "720".into(),
            true,
            true,
            "mp4".into(),
            "mp3".into(),
            Some(Path::new("/tmp/ffmpeg")),
        );

        assert!(args
            .windows(2)
            .any(|pair| pair == ["--merge-output-format", "mkv"]));
        assert!(args.windows(2).any(|pair| pair == ["--remux-video", "mp4"]));
        assert!(args
            .windows(2)
            .any(|pair| pair == ["--ffmpeg-location", "/tmp/ffmpeg"]));
        assert!(args.windows(2).any(|pair| pair == ["--limit-rate", "5M"]));
        assert!(args.windows(2).any(|pair| pair
            == [
                "--sponsorblock-remove",
                "sponsor,intro,outro,selfpromo,interaction"
            ]));
        assert!(args.iter().any(|arg| arg == "--clean-infojson"));
        assert!(args.iter().any(|arg| arg == "--rm-cache-dir"));
        assert!(!args.iter().any(|arg| arg == "-k"));
        assert!(!args.iter().any(|arg| arg == "--keep-video"));
    }

    #[test]
    fn mkv_output_skips_redundant_remux_step() {
        let args = build_download_args(
            "https://example.com/watch?v=test".into(),
            "/tmp/downloads".into(),
            "video".into(),
            "720".into(),
            false,
            false,
            "mkv".into(),
            "mp3".into(),
            Some(Path::new("/tmp/ffmpeg")),
        );

        assert!(args
            .windows(2)
            .any(|pair| pair == ["--merge-output-format", "mkv"]));
        assert!(!args.iter().any(|arg| arg == "--remux-video"));
    }

    #[test]
    fn max_quality_prefers_separate_best_streams() {
        let args = build_download_args(
            "https://example.com/watch?v=test".into(),
            "/tmp/downloads".into(),
            "video".into(),
            "1080".into(),
            false,
            false,
            "mp4".into(),
            "mp3".into(),
            Some(Path::new("/tmp/ffmpeg")),
        );

        assert!(args.windows(2).any(|pair| pair == ["-f", "bestvideo+bestaudio/best"]));
    }

    #[test]
    fn audio_download_only_uses_audio_flags() {
        let args = build_download_args(
            "https://example.com/watch?v=test".into(),
            "/tmp/downloads".into(),
            "audio".into(),
            "1080".into(),
            false,
            false,
            "webm".into(),
            "wav".into(),
            None,
        );

        assert!(args
            .windows(2)
            .any(|pair| pair == ["--audio-format", "wav"]));
        assert!(!args.iter().any(|arg| arg == "--merge-output-format"));
        assert!(!args.iter().any(|arg| arg == "--remux-video"));
        assert!(!args.iter().any(|arg| arg == "--ffmpeg-location"));
        assert!(args.iter().any(|arg| arg == "--clean-infojson"));
        assert!(args.iter().any(|arg| arg == "--rm-cache-dir"));
        assert!(!args.iter().any(|arg| arg == "-k"));
        assert!(!args.iter().any(|arg| arg == "--keep-video"));
    }

    #[test]
    fn ffmpeg_check_does_not_panic_without_path() {
        let _ = find_ffmpeg_in_path();
    }
}
