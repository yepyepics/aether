use std::env;
use std::fs;
use std::path::PathBuf;

fn ffmpeg_binary_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    }
}

fn ffmpeg_sidecar_name(target: &str) -> String {
    if target.contains("windows") {
        format!("ffmpeg-{target}.exe")
    } else {
        format!("ffmpeg-{target}")
    }
}

fn find_ffmpeg_in_path() -> Option<PathBuf> {
    env::var_os("PATH").and_then(|paths| {
        env::split_paths(&paths)
            .map(|dir| dir.join(ffmpeg_binary_name()))
            .find(|path| path.is_file())
    })
}

fn ensure_local_ffmpeg_sidecar() {
    println!("cargo:rerun-if-env-changed=PATH");

    let Ok(target) = env::var("TARGET") else {
        return;
    };

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let bin_dir = manifest_dir.join("bin");
    let sidecar_path = bin_dir.join(ffmpeg_sidecar_name(&target));

    println!("cargo:rerun-if-changed={}", sidecar_path.display());

    if sidecar_path.exists() {
        return;
    }

    let Some(source_ffmpeg) = find_ffmpeg_in_path() else {
        return;
    };

    if fs::create_dir_all(&bin_dir).is_err() {
        return;
    }

    if fs::copy(&source_ffmpeg, &sidecar_path).is_err() {
        return;
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;

        let _ = fs::set_permissions(&sidecar_path, fs::Permissions::from_mode(0o755));
    }
}

fn main() {
    ensure_local_ffmpeg_sidecar();
    tauri_build::build()
}
