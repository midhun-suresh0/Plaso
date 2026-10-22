import React, { useEffect, useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { config } from '../constants/config';
import { theme } from '../constants/theme';
import { authApi } from '../services/authApi';
import { useAuth } from '../context/AuthContext';

let GoogleSignin: any = null;
let statusCodes: any = {};

const getGoogleSignin = () => {
  return null;
};

interface Props {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleAuthButton: React.FC<Props> = ({ onSuccess, onError }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (loading) return;
    
    const signinInstance = getGoogleSignin();
    if (!signinInstance) {
      Alert.alert(
        "Notice", 
        "Google Sign-In is not available in this environment. Please log in with email and password."
      );
      if (onError) onError('Google Sign-In not supported.');
      return;
    }


    setLoading(true);

    try {
      await signinInstance.hasPlayServices();
      const response = await signinInstance.signIn();
      
      if (response.type === 'cancelled') {
        if (onError) onError('Google Sign-In was cancelled.');
        setLoading(false);
        return;
      }
      
      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Send to our backend
      const serverResponse = await authApi.googleLogin(idToken);
      
      if (serverResponse.success && serverResponse.data) {
        await login(serverResponse.data.token, serverResponse.data.user);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(serverResponse.message || 'Google login failed on server');
      }
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled the login flow (legacy API)
        if (onError) onError('Google Sign-In was cancelled.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Operation (e.g. sign in) is in progress already
        if (onError) onError('Google Sign-In is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play services not available or outdated
        if (onError) onError('Google Play Services is not available.');
      } else {
        // Some other error
        console.error('Google Sign-In Error:', error);
        if (onError) onError(error.message || 'Unable to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, loading && styles.buttonDisabled]} 
      onPress={handleGoogleLogin}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.text} />
      ) : (
        <View style={styles.content}>
          <Ionicons name="logo-google" size={20} color={theme.colors.text} style={styles.icon} />
          <Text style={styles.text}>Continue with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  text: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
