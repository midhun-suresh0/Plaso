import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { theme } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gradient';

interface PlasoButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PlasoButton: React.FC<PlasoButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  style,
  textStyle,
  disabled,
  ...props
}) => {
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryContainer;
      case 'ghost':
        return styles.ghostContainer;
      case 'gradient':
        return styles.transparentContainer; // Gradient handles the background
      case 'primary':
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'ghost':
        return styles.ghostText;
      case 'primary':
      case 'gradient':
      default:
        return styles.primaryText;
    }
  };

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'gradient' ? theme.colors.white : theme.colors.primary}
          size="small"
        />
      ) : (
        <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </>
  );

  if (variant === 'gradient' && !disabled) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={loading}
        style={[styles.baseContainer, style]}
        {...props}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientBg, styles.baseContainer]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        getContainerStyle(),
        (disabled || loading) && styles.disabledContainer,
        style,
      ]}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  gradientBg: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transparentContainer: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  primaryContainer: {
    backgroundColor: theme.colors.primary,
  },
  secondaryContainer: {
    backgroundColor: theme.colors.surfaceHighlight,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  text: {
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  primaryText: {
    color: theme.colors.white,
  },
  secondaryText: {
    color: theme.colors.text,
  },
  ghostText: {
    color: theme.colors.textSecondary,
  },
});
