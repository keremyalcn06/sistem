# Android APK build

The SYSTEM app is a Capacitor-wrapped TanStack Start build. Native
integration lives under `src/lib/native/` so feature code never talks to
Capacitor plugins directly (clean-architecture: infrastructure layer).

## One-time setup (local machine)

Requires: Node 20+, JDK 17, Android Studio + Android SDK.

```bash
bun install
bun run build            # produces dist/
bun run android:init     # creates ./android (only the first time)
bun run android:sync     # copies dist/ into the Android project
bun run android:open     # opens Android Studio to build/run/sign APK
```

The `android/` folder is a standard Gradle project — it is what Google Play
expects. Sign a release APK / AAB from Android Studio → Build → Generate
Signed Bundle. No source changes are needed between debug and release.

## Configuration

`capacitor.config.ts` at the repo root controls the native shell:

- `appId`: `app.lovable.system` (change before first Play upload).
- `appName`: `SYSTEM`.
- `webDir`: `dist` (matches the Vite build output).
- Dark theme colors match `src/styles.css` (`#0a0d1a`).

To point a debug APK at a live dev server (hot reload on device) set
`CAP_SERVER_URL` before syncing:

```bash
CAP_SERVER_URL=https://<your-preview-url> bun run android:sync
```

Leave `CAP_SERVER_URL` unset for release builds so the APK ships with
bundled assets and works fully offline.

## What is already wired

- Hardware **back button** → routes through history, exits at root.
- **Lifecycle** (`pause` / `resume`) → dispatched as `system:appstate` DOM
  events; features can listen without importing Capacitor.
- **Status bar** → dark, translucent, overlays the WebView (immersive).
- **Splash screen** → auto-hides after React mounts.
- **Permissions** → centralised in `src/lib/native/permissions.ts`
  (`notifications`, `haptics`). Add new permissions here, never in feature
  code.
- Everything is guarded by `isNative()` so the web build is unaffected.

## Not included on purpose

- No `android/` folder is committed — it is generated per machine via
  `cap add android` to keep the repo Web-first and avoid Gradle churn.
- No Play Store credentials, keystores, or CI signing config.
