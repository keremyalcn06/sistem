import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.system',
  appName: 'SYSTEM',
  webDir: '.output/public',

  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      launchAutoHide: true,
    },
    StatusBar: {
      style: 'DARK',
    }
  },

  android: {
    backgroundColor: '#0a0d1a'
  }
};

export default config;
