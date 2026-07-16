import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dz.firewatch.app',
  appName: 'Algeria Fire Watch',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
