import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { authApi } from '../services/authApi';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoButton } from '../components/PlasoButton';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VerifyOtp'>;
  route: RouteProp<RootStackParamList, 'VerifyOtp'>;
};

const OTP_LENGTH = 6;

export default function VerifyOtpScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Auto-focus the hidden input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);

  const handleVerify = async (currentOtp?: string) => {
    const codeToVerify = currentOtp || otp;
    if (codeToVerify.length !== OTP_LENGTH) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.verifyResetOtp({ email, otp: codeToVerify });
      if (response.success) {
        navigation.navigate('ResetPassword', { email });
      } else {
        setError(response.message || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to verify the OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setResending(true);
    setError('');

    try {
      const response = await authApi.forgotPassword({ email });
      if (response.success) {
        setCountdown(60);
        setOtp('');
        inputRef.current?.focus();
      } else {
        setError(response.message || 'Failed to resend code');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to send a new code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtp(numericValue);
    
    if (numericValue.length === OTP_LENGTH) {
      handleVerify(numericValue);
    }
  };

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < OTP_LENGTH; i++) {
      const char = otp[i] || '';
      const isCurrent = i === otp.length || (i === OTP_LENGTH - 1 && otp.length === OTP_LENGTH);
      
      boxes.push(
        <View 
          key={i} 
          style={[
            styles.otpBox,
            isCurrent && styles.otpBoxActive,
            char ? styles.otpBoxFilled : null,
          ]}
        >
          <Text style={styles.otpText}>{char}</Text>
        </View>
      );
    }
    return boxes;
  };

  // Mask email: user@example.com -> u***r@example.com
  const maskEmail = (emailStr: string) => {
    const [name, domain] = emailStr.split('@');
    if (!domain) return emailStr;
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  };

  return (
    <PlasoScreen>
      <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
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
                <Ionicons name="mail-open-outline" size={32} color={theme.colors.primary} />
              </View>
              <Text style={styles.title}>Check Your Email</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit verification code to{'\n'}
                <Text style={styles.emailText}>{maskEmail(email)}</Text>
              </Text>
            </View>

            <View style={styles.formContainer}>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <View style={styles.otpContainer}>
                {renderOtpBoxes()}
              </View>

              <TextInput
                ref={inputRef}
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                returnKeyType="done"
                textContentType="oneTimeCode"
                style={styles.hiddenInput}
                maxLength={OTP_LENGTH}
                autoFocus
              />

              <PlasoButton
                title="Verify Code"
                variant="gradient"
                onPress={() => handleVerify()}
                loading={loading}
                disabled={otp.length !== OTP_LENGTH}
                style={styles.verifyButton}
              />
              
              <PlasoButton
                title={countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Code"}
                variant="secondary"
                onPress={handleResend}
                disabled={countdown > 0 || resending}
                loading={resending}
                style={styles.resendButton}
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
  emailText: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    width: '100%',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 32, 110, 0.05)',
  },
  otpBoxFilled: {
    borderColor: theme.colors.textSecondary,
  },
  otpText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  verifyButton: {
    width: '100%',
    marginTop: theme.spacing.md,
  },
  resendButton: {
    width: '100%',
    marginTop: theme.spacing.lg,
  },
});
