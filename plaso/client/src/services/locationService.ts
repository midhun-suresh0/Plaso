import * as Location from 'expo-location';

export const locationService = {
  /**
   * Request location permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  },

  /**
   * Check if location permissions are already granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return false;
    }
  },

  /**
   * Get the current device location (latitude & longitude)
   */
  async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Use Balanced to avoid excessive battery usage/delay
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  },
};
