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
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authApi } from '../services/authApi';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoInput } from '../components/PlasoInput';
import { PlasoButton } from '../components/PlasoButton';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<any, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetRequest = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.forgotPassword({ email: email.trim() });
      
      if (response.success) {
        navigation.navigate('VerifyOtp', { email: email.trim() });
      } else {
        setError(response.message || 'Failed to send reset request');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
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
            
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.headerContainer}>
              <View style={styles.iconContainer}>
                <Ionicons name="key-outline" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter your email address and we'll send you a 6-digit verification code to reset your password.</Text>
            </View>

            <View style={styles.formContainer}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <PlasoInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                icon="mail-outline"
              />

              <PlasoButton
                title="Send Verification Code"
                variant="gradient"
                onPress={handleResetRequest}
                loading={loading}
                style={styles.resetButton}
              />
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
    marginBottom: theme.spacing.xxl,
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
});
