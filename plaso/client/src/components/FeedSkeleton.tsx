import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../constants/theme';

export function FeedSkeleton() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const SkeletonCard = () => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Animated.View style={[styles.avatar, { opacity }]} />
        <View style={styles.headerText}>
          <Animated.View style={[styles.titleLine, { opacity }]} />
          <Animated.View style={[styles.subtitleLine, { opacity }]} />
        </View>
      </View>
      <Animated.View style={[styles.contentLine, { opacity, width: '90%' }]} />
      <Animated.View style={[styles.contentLine, { opacity, width: '70%' }]} />
      <Animated.View style={[styles.imageBlock, { opacity }]} />
      <View style={styles.footer}>
        <Animated.View style={[styles.actionButton, { opacity }]} />
        <Animated.View style={[styles.actionButton, { opacity }]} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  titleLine: {
    height: 12,
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  subtitleLine: {
    height: 10,
    width: '25%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
  contentLine: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginBottom: 8,
  },
  imageBlock: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: theme.radii.lg,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  actionButton: {
    width: 60,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.radii.full,
  },
});
