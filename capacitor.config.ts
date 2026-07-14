import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the SYSTEM Android application.
 *
 * The webDir points at `android-webroot/`, populated by
 * `scripts/prepare-android.mjs` after `vite build`. That directory contains
 * only static, offline-capable assets — no server code — so the resulting APK
 * runs without an internet connection.
 *
 * The `server.url` field is intentionally left unset for production builds so
 * the APK ships with those bundled assets. To point a dev build at a live
 * server instead, set the `CAP_SERVER_URL` environment variable before
 * running `bunx cap sync android`.
 */
const devServerUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'app.lovable.system',
  appName: 'SYSTEM',
  webDir: 'android-webroot',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0a0d1a',
    // Local scheme keeps assets under https://localhost so relative absolute
    // paths (/assets/*.js) resolve correctly inside the WebView.
    loggingBehavior: 'production',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#0a0d1a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0d1a',
      overlaysWebView: true,
    },
    App: {
      launchUrl: '',
    },
    Preferences: {
      // Namespaced key group — survives app upgrades so player data persists.
      group: 'SystemPlayerData',
    },
  },
  ...(devServerUrl
    ? {
        server: {
          url: devServerUrl,
          cleartext: true,
          androidScheme: 'https',
        },
      }
    : {}),
};

export default config;
