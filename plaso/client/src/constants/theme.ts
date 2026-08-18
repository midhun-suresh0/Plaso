/**
 * Plaso design theme constants.
 * Dark premium aesthetics: charcoal background, vibrant accent, elevated surfaces.
 */

export const colors = {
  primary: '#FF206E', // Vibrant Neon Pink/Coral for Plaso identity
  primaryDark: '#D91A5E',
  primaryLight: '#FF4D8C',

  background: '#0B0D12', // Very dark charcoal
  surface: '#161922',    // Elevated surface
  surfaceHighlight: '#222633', // Lighter surface for borders/hover

  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textLight: '#6B7280',

  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  border: 'rgba(255, 255, 255, 0.08)',
  divider: 'rgba(255, 255, 255, 0.05)',
  glass: 'rgba(22, 25, 34, 0.6)', // Glassmorphic background
  
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  title: 40,
} as const;

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const theme = {
  colors,
  spacing,
  typography: {
    sizes: fontSize,
  },
  radii: borderRadius,
};
