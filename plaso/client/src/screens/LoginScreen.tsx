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
  navigation: NativeStackNavigationProp<any, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email, password });
      
      if (response.success && response.data) {
        await login(response.data.token, response.data.user);
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login');
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
            <Text style={styles.title}>Welcome back.</Text>
            <Text style={styles.subtitle}>Sign in to continue to your local network</Text>
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

            <PlasoInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
              icon="lock-closed-outline"
            />

            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <PlasoButton
              title="Sign In"
              variant="gradient"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: theme.spacing.xxl,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.xl,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: theme.spacing.xl,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  registerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  registerLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
});
