import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps } from 'react-native';
import { theme } from '../constants/theme';

interface PlasoChipProps extends TouchableOpacityProps {
  label: string;
  selected?: boolean;
}

export const PlasoChip: React.FC<PlasoChipProps> = ({ label, selected = false, style, ...props }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  text: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
  },
  textSelected: {
    color: theme.colors.white,
  },
  textUnselected: {
    color: theme.colors.textSecondary,
  },
});
