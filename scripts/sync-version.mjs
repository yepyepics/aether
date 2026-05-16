import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function resolveRepoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function normalizeVersion(rawVersion) {
  const trimmed = rawVersion.trim();
  const withoutPrefix = trimmed.replace(/^v/i, "");
  const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

  if (!semverPattern.test(withoutPrefix)) {
    throw new Error(`Unsupported version format: ${rawVersion}`);
  }

  return withoutPrefix;
}

function tryExecGit(args) {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function detectVersion() {
  const candidate = process.argv[2] ?? process.env.APP_VERSION ?? process.env.GITHUB_REF_NAME;
  if (candidate) return normalizeVersion(candidate);

  const exactTag = tryExecGit(["describe", "--tags", "--exact-match", "--match", "v*"]);
  if (exactTag) return normalizeVersion(exactTag);

  const nearestTag = tryExecGit(["describe", "--tags", "--abbrev=0", "--match", "v*"]);
  if (nearestTag) return normalizeVersion(nearestTag);

  const packageJson = JSON.parse(readFileSync(resolveRepoPath("package.json"), "utf8"));
  if (typeof packageJson.version === "string" && packageJson.version.trim()) {
    return normalizeVersion(packageJson.version);
  }

  throw new Error("Unable to determine app version from git tags or package.json");
}

function updateJsonFile(relativePath, apply) {
  const absolutePath = resolveRepoPath(relativePath);
  const current = JSON.parse(readFileSync(absolutePath, "utf8"));
  const next = apply(current);
  writeFileSync(absolutePath, `${JSON.stringify(next, null, 2)}\n`);
}

function updateCargoManifest(relativePath, version) {
  const absolutePath = resolveRepoPath(relativePath);
  const current = readFileSync(absolutePath, "utf8");
  const packageVersionPattern = /^version = ".*"$/m;
  if (!packageVersionPattern.test(current)) {
    throw new Error(`Unable to update version in ${relativePath}`);
  }

  const next = current.replace(packageVersionPattern, `version = "${version}"`);
  writeFileSync(absolutePath, next);
}

const version = detectVersion();

updateJsonFile("package.json", (pkg) => ({ ...pkg, version }));
updateJsonFile("src-tauri/tauri.conf.json", (config) => ({ ...config, version }));
updateCargoManifest("src-tauri/Cargo.toml", version);

process.stdout.write(`Synchronized app version to ${version}\n`);
