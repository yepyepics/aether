use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::AsyncWriteExt;

#[derive(Serialize, Deserialize, Default)]
struct UpdaterState {
    last_check: Option<String>,
    version: Option<String>,
}

#[derive(Deserialize)]
struct GithubRelease {
    tag_name: String,
    assets: Vec<GithubAsset>,
}

#[derive(Deserialize)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
}

fn state_path(app: &AppHandle) -> Option<PathBuf> {
    app.path()
        .app_local_data_dir()
        .ok()
        .map(|d| d.join("ytdlp_updater.json"))
}

fn read_state(path: &Path) -> UpdaterState {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn write_state(path: &Path, state: &UpdaterState) {
    if let Ok(json) = serde_json::to_string(state) {
        let _ = std::fs::write(path, json);
    }
}

fn unix_now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn should_check(state: &UpdaterState) -> bool {
    match &state.last_check {
        None => true,
        Some(ts) => {
            let last: u64 = ts.parse().unwrap_or(0);
            unix_now().saturating_sub(last) >= 86_400
        }
    }
}

fn platform_asset_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "yt-dlp.exe"
    } else if cfg!(target_os = "macos") {
        "yt-dlp_macos"
    } else {
        "yt-dlp_linux"
    }
}

fn local_bin_name() -> &'static str {
    if cfg!(windows) {
        "yt-dlp.exe"
    } else {
        "yt-dlp"
    }
}

pub fn local_bin_path(app: &AppHandle) -> Option<PathBuf> {
    let path = app.path().app_local_data_dir().ok()?.join(local_bin_name());
    if path.exists() {
        Some(path)
    } else {
        None
    }
}

pub async fn check_and_update(app: AppHandle) {
    // Give the frontend time to mount and register event listeners before we emit.
    tokio::time::sleep(std::time::Duration::from_secs(2)).await;

    let Some(state_file) = state_path(&app) else {
        return;
    };
    if let Some(parent) = state_file.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    let state = read_state(&state_file);
    if !should_check(&state) {
        return;
    }

    let client = match reqwest::Client::builder()
        .user_agent("aether/0.0.1-beta")
        .build()
    {
        Ok(c) => c,
        Err(_) => return,
    };

    let release: GithubRelease = match client
        .get("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest")
        .send()
        .await
        .and_then(|r| r.error_for_status())
    {
        Ok(r) => match r.json().await {
            Ok(j) => j,
            Err(_) => return,
        },
        Err(_) => return,
    };

    let latest = release.tag_name.clone();
    let current = state.version.clone().unwrap_or_default();

    if latest == current {
        write_state(
            &state_file,
            &UpdaterState {
                last_check: Some(unix_now().to_string()),
                version: Some(latest),
            },
        );
        return;
    }

    let asset_name = platform_asset_name();
    let Some(asset) = release.assets.iter().find(|a| a.name == asset_name) else {
        write_state(
            &state_file,
            &UpdaterState {
                last_check: Some(unix_now().to_string()),
                version: state.version,
            },
        );
        return;
    };

    let _ = app.emit("ytdlp-update-start", &latest);

    let Ok(data_dir) = app.path().app_local_data_dir() else {
        return;
    };
    let _ = std::fs::create_dir_all(&data_dir);

    let dest = data_dir.join(local_bin_name());
    let tmp = data_dir.join(format!("{}.tmp", local_bin_name()));

    match download_file(&client, &asset.browser_download_url, &tmp, &app).await {
        Ok(()) => {
            let _ = std::fs::rename(&tmp, &dest);
            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let _ = std::fs::set_permissions(&dest, std::fs::Permissions::from_mode(0o755));
            }
            write_state(
                &state_file,
                &UpdaterState {
                    last_check: Some(unix_now().to_string()),
                    version: Some(latest.clone()),
                },
            );
            let _ = app.emit("ytdlp-update-done", &latest);
        }
        Err(_) => {
            let _ = std::fs::remove_file(&tmp);
            let _ = app.emit("ytdlp-update-error", ());
            write_state(
                &state_file,
                &UpdaterState {
                    last_check: Some(unix_now().to_string()),
                    version: state.version,
                },
            );
        }
    }
}

async fn download_file(
    client: &reqwest::Client,
    url: &str,
    dest: &Path,
    app: &AppHandle,
) -> Result<(), String> {
    let resp = client
        .get(url)
        .send()
        .await
        .and_then(|r| r.error_for_status())
        .map_err(|e| e.to_string())?;

    let total = resp.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut last_pct: u8 = 0;

    let mut file = tokio::fs::File::create(dest)
        .await
        .map_err(|e| e.to_string())?;

    let mut stream = resp.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;
        file.write_all(&chunk).await.map_err(|e| e.to_string())?;

        if total > 0 {
            let pct = (downloaded as f64 / total as f64 * 100.0) as u8;
            if pct != last_pct {
                let _ = app.emit("ytdlp-update-progress", pct);
                last_pct = pct;
            }
        }
    }

    Ok(())
}
