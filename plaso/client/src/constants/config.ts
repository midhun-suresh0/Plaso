/**
 * Application configuration constants.
 * Centralized place for environment-dependent values.
 */

// Use your machine's local IP when testing on physical devices.
// 'localhost' works for web and iOS simulator.
// For Android emulator, use '10.0.2.2' instead.
const API_BASE_URL = __DEV__
  ? 'http://10.137.228.100:5000/api'  // Physical device local IP
  : 'https://api.plaso.app/api'; // Production (future)

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 10000, // 10 seconds
  },
} as const;
