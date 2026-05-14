use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

mod updater;

#[derive(Clone, serde::Serialize)]
struct LinePayload {
    line: String,
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
        let height = match quality.as_str() {
            "720" => "720",
            "480" => "480",
            _ => "1080",
        };
        args.push("-f".into());
        args.push(format!(
            "bestvideo[height<={}]+bestaudio/best[height<={}]",
            height, height
        ));
        args.push("--merge-output-format".into());
        args.push(video_format);
    }

    if sponsorblock {
        args.push("--sponsorblock-remove".into());
        args.push("sponsor,intro,outro,selfpromo,interaction".into());
    }

    if eco_mode {
        args.push("--limit-rate".into());
        args.push("5M".into());
    }

    args.extend([
        "--newline".into(),
        "-o".into(),
        format!("{}/%(title)s.%(ext)s", output_dir),
        url,
    ]);

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
