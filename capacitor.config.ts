import type { CapacitorConfig } from '@capacitor/cli';

const devServerUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'app.lovable.system',
  appName: 'SYSTEM',
  webDir: '.output/public',
  bundledWebRuntime: false,

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    backgroundColor: '#0a0d1a',
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
