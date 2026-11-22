import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.divriz.aftermotion',
  appName: 'DIVRIZ After Motion',
  webDir: 'dist',
  server: { androidScheme: 'https' }, // secure context -> WebCodecs (video encoder) available
  android: { allowMixedContent: false },
};

export default config;
