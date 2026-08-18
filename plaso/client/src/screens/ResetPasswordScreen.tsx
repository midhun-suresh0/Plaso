import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { authApi } from '../services/authApi';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoInput } from '../components/PlasoInput';
import { PlasoButton } from '../components/PlasoButton';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
  route: RouteProp<RootStackParamList, 'ResetPassword'>;
};

export default function ResetPasswordScreen({ navigation, route }: Props) {
  const { email } = route.params;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (password.length < 8 || !hasUpperCase || !hasLowerCase || !hasNumber) {
      setError('Password must be at least 8 characters and contain uppercase, lowercase, and a number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.resetPassword({ 
        email, 
        newPassword: password, 
        confirmPassword 
      });
      
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlasoScreen>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed-outline" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.subtitle}>Your new password must be different from previous used passwords.</Text>
            </View>

            <View style={styles.formContainer}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              {success ? (
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.success} style={styles.successIconBig} />
                  <Text style={styles.successTitle}>Password Reset Successfully!</Text>
                  <Text style={styles.successText}>You can now sign in with your new password.</Text>
                  
                  <PlasoButton
                    title="Go to Login"
                    variant="gradient"
                    onPress={() => navigation.navigate('Login')}
                    style={styles.loginButton}
                  />
                </View>
              ) : (
                <>

                  <PlasoInput
                    label="New Password"
                    placeholder="Enter new password"
                    value={password}
                    onChangeText={setPassword}
                    isPassword
                    icon="lock-closed-outline"
                  />

                  <PlasoInput
                    label="Confirm New Password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    isPassword
                    icon="lock-closed-outline"
                  />

                  <PlasoButton
                    title="Reset Password"
                    variant="gradient"
                    onPress={handleResetPassword}
                    loading={loading}
                    style={styles.resetButton}
                  />
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  backButton: {
    marginBottom: theme.spacing.xl,
    alignSelf: 'flex-start',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.radii.full,
  },
  headerContainer: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 32, 110, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.sizes.title,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
  },
  resetButton: {
    marginTop: theme.spacing.lg,
  },
  successContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successIconBig: {
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  successText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: theme.typography.sizes.md,
    lineHeight: 22,
    marginBottom: theme.spacing.xxl,
  },
  loginButton: {
    width: '100%',
  },
});
