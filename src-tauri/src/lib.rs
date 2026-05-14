use tauri::{AppHandle, Emitter};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

#[derive(Clone, serde::Serialize)]
struct LinePayload {
    line: String,
}

/// Запускает yt-dlp как sidecar и транслирует stdout/stderr во фронтенд.
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
    quality: String, // "1080" | "720" | "480" (игнорируется для аудио)
) -> Result<(), String> {
    let mut args: Vec<String> = Vec::new();

    if format == "audio" {
        args.extend([
            "-x".into(),
            "--audio-format".into(),
            "mp3".into(),
            "--audio-quality".into(),
            "0".into(),
        ]);
    } else {
        let height = match quality.as_str() {
            "720" => "720",
            "480" => "480",
            _     => "1080",
        };
        // bestvideo[height<=X]+bestaudio, с фолбэком на best
        args.push("-f".into());
        args.push(format!(
            "bestvideo[height<={}]+bestaudio/best[height<={}]",
            height, height
        ));
        args.push("--merge-output-format".into());
        args.push("mp4".into());
    }

    args.extend([
        "--newline".into(), // каждая строка прогресса — отдельная строка stdout
        "-o".into(),
        format!("{}/%(title)s.%(ext)s", output_dir),
        url,
    ]);

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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![start_download])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
