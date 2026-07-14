#!/usr/bin/env node
/**
 * prepare-android.mjs
 *
 * TanStack Start's Nitro output is a Cloudflare-Worker server bundle plus a
 * `.output/public/` directory of static client assets. Capacitor needs a
 * flat static web directory it can bundle inside the APK, so this script:
 *
 *   1. Locates the built static assets (`.output/public`).
 *   2. Copies them into `android-webroot/` (the Capacitor `webDir`).
 *   3. Ensures an `index.html` exists so the WebView has an entry point
 *      even when the app is fully offline (the SPA hydrates from the
 *      client bundle and continues to work without network access).
 *
 * Run automatically by `bun run android:build`. Safe to re-run.
 */
import { cp, mkdir, readFile, writeFile, stat, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const CANDIDATE_SOURCES = [
  ".output/public",
  "dist/client",
  "dist",
];
const TARGET = "android-webroot";

async function pickSource() {
  for (const rel of CANDIDATE_SOURCES) {
    const abs = resolve(ROOT, rel);
    if (existsSync(abs)) {
      const s = await stat(abs);
      if (s.isDirectory()) {
        const entries = await readdir(abs);
        if (entries.length > 0) return abs;
      }
    }
  }
  throw new Error(
    "No build output found. Run `bun run build` before `android:sync`.\n" +
      `Looked in: ${CANDIDATE_SOURCES.join(", ")}`,
  );
}

const FALLBACK_INDEX = `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>SYSTEM</title>
  </head>
  <body>
    <div id="app">SYSTEM offline shell — rebuild with \`bun run build\`.</div>
  </body>
</html>
`;

async function main() {
  const src = await pickSource();
  const dst = resolve(ROOT, TARGET);
  await mkdir(dst, { recursive: true });
  await cp(src, dst, { recursive: true, force: true });

  const indexPath = join(dst, "index.html");
  if (!existsSync(indexPath)) {
    // Nitro prerender may not produce index.html for SPA-style apps; write a
    // minimal offline shell so Capacitor has something to load.
    await writeFile(indexPath, FALLBACK_INDEX, "utf8");
  } else {
    // Ensure any leading "/" in <base href> or asset URLs still resolves
    // under the Capacitor `file://` / `https://localhost` scheme. Vite emits
    // absolute paths like `/assets/…` which Capacitor's WebView resolves
    // fine, so no rewriting is necessary — we just verify the file exists.
    const html = await readFile(indexPath, "utf8");
    if (!html.includes("<div") && !html.includes("<script")) {
      throw new Error(`Prerendered ${indexPath} looks empty.`);
    }
  }

  console.log(`[prepare-android] Copied ${src} → ${dst}`);
}

main().catch((err) => {
  console.error("[prepare-android]", err.message);
  process.exit(1);
});
