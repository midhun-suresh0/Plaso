/**
 * Application configuration constants.
 * Centralized place for environment-dependent values.
 */

// Use your machine's local IP when testing on physical devices.
// 'localhost' works for web and iOS simulator.
// For Android emulator, use '10.0.2.2' instead.
const API_BASE_URL = __DEV__
  ? 'http://10.121.191.100:5000/api'  // Physical device local IP
  : 'https://api.plaso.app/api'; // Production (future)

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 10000, // 10 seconds
  },
  google: {
    // Replace with different client IDs if needed later for Web/iOS
    webClientId: '80819047360-05l6sga67nup4baf0khpib8lmm5cb6kg.apps.googleusercontent.com',
    androidClientId: '80819047360-05l6sga67nup4baf0khpib8lmm5cb6kg.apps.googleusercontent.com',
    iosClientId: '80819047360-05l6sga67nup4baf0khpib8lmm5cb6kg.apps.googleusercontent.com',
  }
} as const;
