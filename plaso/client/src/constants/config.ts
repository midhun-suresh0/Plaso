import { Platform, NativeModules } from 'react-native';
import { tokenStorage } from '../services/tokenStorage';

export const LOCAL_DEV_IP = '192.168.57.169';
export const CLOUD_API_URL = 'https://plaso.onrender.com/api';
export const LOCAL_API_URL = `http://${LOCAL_DEV_IP}:5000/api`;

let activeCustomUrl: string | null = null;

// Initialize custom URL from persistent storage asynchronously
tokenStorage.getServerUrl().then(url => {
  if (url) {
    activeCustomUrl = url;
  }
}).catch(() => {});

export const setCustomApiBaseUrl = async (url: string | null) => {
  activeCustomUrl = url;
  if (url) {
    await tokenStorage.saveServerUrl(url);
  } else {
    await tokenStorage.removeServerUrl();
  }
};

export const getCustomApiBaseUrl = (): string | null => {
  return activeCustomUrl;
};

/**
 * Dynamically resolves the development API base URL:
 * 1. Web browser: uses window.location.hostname (e.g. localhost or 192.168.57.169)
 * 2. Mobile (Expo Go / React Native): inspects NativeModules.SourceCode.scriptURL
 *    which points to the Metro bundler host IP.
 * 3. Fallback: current machine Wi-Fi IPv4 (192.168.57.169)
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

  return LOCAL_API_URL;
};

export const config = {
  api: {
    get baseUrl(): string {
      if (activeCustomUrl) {
        return activeCustomUrl;
      }
      return __DEV__ ? getDevApiBaseUrl() : CLOUD_API_URL;
    },
    timeout: 30000, // 30 seconds (allows sleeping cloud instances to wake up)
  },
  google: {
    webClientId: '80819047360-05l6sga67nup4baf0khpib8lmm5cb6kg.apps.googleusercontent.com',
    androidClientId: '80819047360-05l6sga67nup4baf0khpib8lmm5cb6kg.apps.googleusercontent.com',
    iosClientId: '80819047360-05l6sga67nup4baf0khpib8lmm5cb6kg.apps.googleusercontent.com',
    redirectUri: 'http://localhost:8081',
  }
} as const;
