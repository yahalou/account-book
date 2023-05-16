import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ionic.finalproject',
  appName: 'finalproject',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
,
    android: {
       buildOptions: {
          keystorePath: 'd:\key\key.jks',
          keystoreAlias: 'key0',
       }
    }
  };

export default config;
