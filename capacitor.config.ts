import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.system',
  appName: 'SYSTEM',

  webDir: 'android/app/src/main/assets/public',

  bundledWebRuntime: false,

  android: {
    backgroundColor: '#0a0d1a',
    allowMixedContent: false,
    webContentsDebuggingEnabled: false
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
      backgroundColor: '#0a0d1a',
      showSpinner: false
    },

    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0d1a'
    }
  }
};

export default config;
