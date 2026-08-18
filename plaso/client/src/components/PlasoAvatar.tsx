import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

interface PlasoAvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  hasStory?: boolean;
  style?: ViewStyle;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
  hero: 120,
};

export const PlasoAvatar: React.FC<PlasoAvatarProps> = ({
  uri,
  name,
  size = 'md',
  hasStory = false,
  style,
}) => {
  const dim = sizeMap[size];

  const content = (
    <View style={[styles.innerContainer, { width: dim, height: dim, borderRadius: dim / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <Text style={[styles.placeholderText, { fontSize: dim * 0.4 }]}>
          {name ? name.charAt(0).toUpperCase() : 'U'}
        </Text>
      )}
    </View>
  );

  if (hasStory) {
    const outerDim = dim + 6;
    return (
      <LinearGradient
        colors={[theme.colors.primary, '#F59E0B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.storyRing,
          { width: outerDim, height: outerDim, borderRadius: outerDim / 2 },
          style,
        ]}
      >
        <View style={styles.storyInnerRing}>
          {content}
        </View>
      </LinearGradient>
    );
  }

  return <View style={[styles.baseContainer, style]}>{content}</View>;
};

const styles = StyleSheet.create({
  baseContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyInnerRing: {
    backgroundColor: theme.colors.background,
    padding: 3,
    borderRadius: 999,
  },
  innerContainer: {
    backgroundColor: theme.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});
