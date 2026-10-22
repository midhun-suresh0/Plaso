import { Platform, NativeModules } from 'react-native';

/**
 * Dynamically resolves the development API base URL:
 * 1. Web browser: uses window.location.hostname (e.g. localhost or 10.142.178.100)
 * 2. Mobile (Expo Go / React Native): inspects NativeModules.SourceCode.scriptURL
 *    which points to the Metro bundler host IP.
 * 3. Fallback: current machine Wi-Fi IPv4 (10.142.178.100)
 */
const getDevApiBaseUrl = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5000/api`;
  }

  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/^https?:\/\/([^/:]+)/);
    if (match && match[1]) {
      const host = match[1];
      if ((host === 'localhost' || host === '127.0.0.1') && Platform.OS === 'android') {
        return 'http://10.0.2.2:5000/api';
      }
      return `http://${host}:5000/api`;
    }
  }

  return 'http://10.142.178.100:5000/api';
};

export const config = {
  api: {
    get baseUrl(): string {
      return __DEV__ ? getDevApiBaseUrl() : 'https://plaso.onrender.com/api';
    },
    timeout: 15000, // 15 seconds
  },
  google: {
    webClientId: '80819047360-05l6sga67nup4baf0khpib8lmm5cb6kg.apps.googleusercontent.com',
    androidClientId: '80819047360-05l6sga67nup4baf0khpib8lmm5cb6kg.apps.googleusercontent.com',
    iosClientId: '80819047360-05l6sga67nup4baf0khpib8lmm5cb6kg.apps.googleusercontent.com',
    redirectUri: 'http://localhost:8081',
  }
} as const;
