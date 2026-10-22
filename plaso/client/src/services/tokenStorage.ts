import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'plaso_auth_token';

export const tokenStorage = {
  /**
   * Saves the JWT token to secure storage
   */
  async saveToken(token: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(TOKEN_KEY, token);
        }
      } else {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      }
    } catch (error) {
      console.error('Error saving auth token:', error);
      throw error;
    }
  },

  /**
   * Retrieves the JWT token from secure storage
   */
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(TOKEN_KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error retrieving auth token:', error);
      return null;
    }
  },

  /**
   * Removes the JWT token from secure storage
   */
  async removeToken(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(TOKEN_KEY);
        }
      } else {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error removing auth token:', error);
      throw error;
    }
  },

  /**
   * Saves custom backend server URL
   */
  async saveServerUrl(url: string): Promise<void> {
    try {
      const KEY = 'plaso_custom_server_url';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(KEY, url);
        }
      } else {
        await SecureStore.setItemAsync(KEY, url);
      }
    } catch (error) {
      console.error('Error saving custom server URL:', error);
    }
  },

  /**
   * Retrieves custom backend server URL
   */
  async getServerUrl(): Promise<string | null> {
    try {
      const KEY = 'plaso_custom_server_url';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(KEY);
        }
        return null;
      }
      return await SecureStore.getItemAsync(KEY);
    } catch (error) {
      console.error('Error retrieving custom server URL:', error);
      return null;
    }
  },

  /**
   * Clears custom backend server URL
   */
  async removeServerUrl(): Promise<void> {
    try {
      const KEY = 'plaso_custom_server_url';
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(KEY);
        }
      } else {
        await SecureStore.deleteItemAsync(KEY);
      }
    } catch (error) {
      console.error('Error removing custom server URL:', error);
    }
  },
};
