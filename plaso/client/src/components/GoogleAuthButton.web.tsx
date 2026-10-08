import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { config } from '../constants/config';
import { authApi } from '../services/authApi';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants/theme';

interface Props {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleAuthButton: React.FC<Props> = ({ onSuccess, onError }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run in browser context
    if (typeof window === 'undefined') return;

    const handleCredentialResponse = async (response: any) => {
      if (!response.credential) return;
      setLoading(true);
      try {
        const res = await authApi.googleLogin(response.credential);
        if (res.success && res.data) {
          await login(res.data.token, res.data.user);
          if (onSuccess) onSuccess();
        } else {
          throw new Error(res.message || 'Google login failed on server');
        }
      } catch (err: any) {
        if (onError) onError(err.message || 'Error logging in with Google');
      } finally {
        setLoading(false);
      }
    };

    const initGoogle = () => {
      // @ts-ignore - Google identity services injects this
      if (!window.google?.accounts?.id) return;
      
      // @ts-ignore
      window.google.accounts.id.initialize({
        client_id: config.google.webClientId,
        callback: handleCredentialResponse,
      });
      
      if (buttonRef.current) {
        // @ts-ignore
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '300',
          type: 'standard',
          shape: 'rectangular',
        });
      }
    };

    const loadScript = () => {
      // @ts-ignore
      if (window.google?.accounts?.id) {
        initGoogle();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    };

    loadScript();
  }, [login, onSuccess, onError]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color={theme.colors.text} />
        </View>
      ) : (
        <div ref={buttonRef} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  loadingWrapper: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    width: '100%',
    backgroundColor: theme.colors.surface,
  }
});
