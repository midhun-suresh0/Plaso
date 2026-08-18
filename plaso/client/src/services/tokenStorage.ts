import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'plaso_auth_token';

export const tokenStorage = {
  /**
   * Saves the JWT token to secure storage
   */
  async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
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
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing auth token:', error);
      throw error;
    }
  },
};
