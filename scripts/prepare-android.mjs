// Builds the standalone SPA bundle used by the Capacitor Android app.
// The web app keeps using TanStack Start SSR; on Android there is no server
// inside the WebView, so we ship a pure client-side bundle produced by
// vite.spa.config.mjs into `android-webroot/` (Capacitor `webDir`).
//
// This script exists so `npm run android:build` stays a single command,
// and so future tweaks (e.g. copying extra assets) have one place to live.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "vite.spa.config.mjs");
const target = path.join(root, "android-webroot");

if (!fs.existsSync(configPath)) {
  console.error(`[android] Missing ${configPath}`);
  process.exit(1);
}

console.log("[android] building SPA bundle → android-webroot/");
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", "build", "--config", "vite.spa.config.mjs"],
  { stdio: "inherit", cwd: root },
);

if (result.status !== 0) {
  console.error("[android] SPA build failed");
  process.exit(result.status ?? 1);
}

const html = path.join(target, "index.html");
if (!fs.existsSync(html)) {
  console.error(`[android] Expected ${html} to exist after build`);
  process.exit(1);
}
console.log(`[android] webroot ready → ${target}`);
