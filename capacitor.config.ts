import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the SYSTEM Android application.
 *
 * The `server.url` field is intentionally left unset for production builds so
 * the APK ships with the bundled web assets located under `dist/`. To point a
 * dev build at the Lovable preview instead, set the `CAP_SERVER_URL`
 * environment variable before running `npx cap sync android`.
 */
const devServerUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'app.lovable.system',
  appName: 'SYSTEM',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0a0d1a',
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
