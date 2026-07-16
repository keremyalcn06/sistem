// Copies the Vite/Nitro client build into `android-webroot/` (Capacitor
// `webDir`) and synthesizes an `index.html` that boots the TanStack Start
// client bundle. Runs after `vite build`, before `cap sync`.
//
// The canonical output for this template is `dist/client`. Older nitro
// presets emitted `.output/public`; we accept it as a fallback so a stale
// build directory never blocks the Android pipeline.
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidates = [
  path.join(root, "dist", "client"),
  path.join(root, ".output", "public"),
];
const source = candidates.find((p) => fs.existsSync(p));
const target = path.join(root, "android-webroot");

if (!source) {
  console.error(
    "[android] No web build found. Expected one of:\n" +
      candidates.map((c) => "  - " + c).join("\n") +
      "\nRun `npm run build` (or `bun run build`) first.",
  );
  process.exit(1);
}
console.log(`[android] using web build → ${path.relative(root, source)}`);

// Wipe target (preserve nothing — every build must be self-consistent).
fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, { recursive: true });

// Locate hashed entry chunk + css.
const assetsDir = path.join(target, "assets");
const assets = fs.readdirSync(assetsDir);
const entryJs = assets.find((f) => /^index-[^.]+\.js$/.test(f));
const styleCss = assets.find((f) => /^styles-[^.]+\.css$/.test(f));

if (!entryJs) {
  console.error("[android] Could not find entry chunk (assets/index-*.js).");
  process.exit(1);
}

const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no" />
<meta name="theme-color" content="#0a0d1a" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<title>SYSTEM</title>
${styleCss ? `<link rel="stylesheet" href="/assets/${styleCss}" />` : ""}
<link rel="icon" href="/favicon.ico" type="image/x-icon" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Rajdhani:wght@400;500;600;700&display=swap" />
<style>html,body{background:#0a0d1a;color:#e6ecff;margin:0;font-family:Rajdhani,system-ui,sans-serif;}#app{min-height:100vh;}</style>
</head>
<body>
<div id="app"></div>
<script type="module" src="/assets/${entryJs}"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(target, "index.html"), html, "utf8");
console.log(`[android] webroot ready → ${target} (entry: ${entryJs})`);
