import React, { useState } from 'react';
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
import { authApi } from '../services/authApi';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoInput } from '../components/PlasoInput';
import { PlasoButton } from '../components/PlasoButton';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  navigation: NativeStackNavigationProp<any, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
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
      const response = await authApi.register({ name, email, password });
      
      if (response.success && response.data) {
        await login(response.data.token, response.data.user);
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration');
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
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.warning]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoBadge}
                />
                <Text style={styles.logoText}>PLASO</Text>
              </View>
              <Text style={styles.title}>Join the network.</Text>
              <Text style={styles.subtitle}>Create an account to start exploring</Text>
            </View>

            <View style={styles.formContainer}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <PlasoInput
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                icon="person-outline"
              />

              <PlasoInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                icon="mail-outline"
              />

              <PlasoInput
                label="Password"
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                isPassword
                icon="lock-closed-outline"
              />

              <PlasoInput
                label="Confirm Password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                isPassword
                icon="lock-closed-outline"
              />

              <PlasoButton
                title="Create Account"
                variant="gradient"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerButton}
              />

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
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
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: theme.spacing.xxl,
    marginTop: theme.spacing.xl,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    marginRight: theme.spacing.sm,
  },
  logoText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.xl,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    fontSize: theme.typography.sizes.title,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
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
  registerButton: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: theme.spacing.xxl,
  },
  loginText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  loginLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
});
