import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { config } from '../constants/config';
import { theme } from '../constants/theme';
import { authApi } from '../services/authApi';
import { useAuth } from '../context/AuthContext';

let GoogleSignin: any = null;
let statusCodes: any = {};

const loadNativeGoogleSignin = (): any => {
  if (GoogleSignin) return GoogleSignin;
  try {
    const GoogleSigninModule = require('@react-native-google-signin/google-signin');
    const instance = GoogleSigninModule.GoogleSignin || GoogleSigninModule.default?.GoogleSignin;
    statusCodes = GoogleSigninModule.statusCodes || {};
    if (instance && typeof instance.configure === 'function') {
      instance.configure({
        webClientId: config.google.webClientId,
        iosClientId: config.google.iosClientId,
        offlineAccess: false,
      });
      GoogleSignin = instance;
      return GoogleSignin;
    }
  } catch (e) {
    // Native module not linked in this runtime environment
  }
  return null;
};

interface Props {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GoogleAuthButton: React.FC<Props> = ({ onSuccess, onError }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [webLoading, setWebLoading] = useState(true);
  const [nonce, setNonce] = useState('');
  const handledRef = useRef(false);

  // Send the Google ID Token to the Plaso backend
  const handleBackendLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const serverResponse = await authApi.googleLogin(idToken);
      if (serverResponse.success && serverResponse.data) {
        await login(serverResponse.data.token, serverResponse.data.user);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(serverResponse.message || 'Google login failed on server');
      }
    } catch (err: any) {
      console.error('[GoogleAuth] Server login error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to authenticate with Google';
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;

    // 1. Try native Google Sign-In first if available
    const signinInstance = loadNativeGoogleSignin();
    if (signinInstance) {
      setLoading(true);
      try {
        await signinInstance.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const response = await signinInstance.signIn();

        if (response.type === 'cancelled') {
          if (onError) onError('Google Sign-In was cancelled.');
          setLoading(false);
          return;
        }

        const idToken = response.data?.idToken || response.idToken;
        if (idToken) {
          await handleBackendLogin(idToken);
          return;
        }
      } catch (error: any) {
        if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
          setLoading(false);
          return;
        }
        console.log('[GoogleAuth] Native Google Sign-In fallback to OAuth webview:', error.message);
      } finally {
        setLoading(false);
      }
    }

    // 2. Seamless fallback: Launch In-App Google OAuth flow
    handledRef.current = false;
    const newNonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    setNonce(newNonce);
    setWebLoading(true);
    setShowModal(true);
  };

  // Inspect navigation state for id_token redirect
  const checkUrl = (url: string): boolean => {
    if (!url || handledRef.current) return true;

    // Check for error redirect
    if (url.includes('error=')) {
      const errMatch = url.match(/[#?&]error=([^&]+)/);
      const errReason = errMatch ? decodeURIComponent(errMatch[1]) : 'Authentication failed';
      handledRef.current = true;
      setShowModal(false);
      if (errReason !== 'access_denied' && onError) {
        onError(`Google Sign-In error: ${errReason}`);
      }
      return false;
    }

    // Check for id_token in hash or query
    if (url.includes('id_token=')) {
      const match = url.match(/[#?&]id_token=([^&]+)/);
      if (match && match[1]) {
        handledRef.current = true;
        const idToken = decodeURIComponent(match[1]);
        setShowModal(false);
        handleBackendLogin(idToken);
        return false;
      }
    }

    return true;
  };

  const redirectUri = config.google.redirectUri || 'http://localhost:8081';
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
    config.google.webClientId
  )}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=id_token%20token&scope=openid%20email%20profile&nonce=${nonce}&prompt=select_account`;

  return (
    <>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleGoogleLogin}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.text} />
        ) : (
          <View style={styles.content}>
            <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.icon} />
            <Text style={styles.text}>Continue with Google</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* In-App Google OAuth Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sign in with Google</Text>
            <View style={{ width: 40 }} />
          </View>

          {webLoading && (
            <View style={styles.loadingBar}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}

          <WebView
            source={{ uri: oauthUrl }}
            userAgent="Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"
            onLoadStart={() => setWebLoading(true)}
            onLoadEnd={() => setWebLoading(false)}
            onNavigationStateChange={(navState) => {
              checkUrl(navState.url);
            }}
            onShouldStartLoadWithRequest={(request) => {
              return checkUrl(request.url);
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            style={styles.webview}
          />
        </SafeAreaView>
      </Modal>
    </>
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
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  loadingBar: {
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
