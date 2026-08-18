import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../constants/theme';

interface PlasoCardProps extends ViewProps {
  glass?: boolean;
}

export const PlasoCard: React.FC<PlasoCardProps> = ({ children, glass, style, ...props }) => {
  return (
    <View
      style={[
        styles.card,
        glass ? styles.glassCard : styles.solidCard,
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radii.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  solidCard: {
    backgroundColor: theme.colors.surface,
  },
  glassCard: {
    backgroundColor: theme.colors.glass,
  },
});
