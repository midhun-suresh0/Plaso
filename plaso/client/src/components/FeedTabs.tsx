import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import { BlurView } from 'expo-blur';

type Tab = 'home' | 'nearby';

interface FeedTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  return (
    <View style={styles.container}>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'home' && styles.activeTab]}
            onPress={() => onTabChange('home')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'home' && styles.activeTabText,
              ]}
            >
              For You
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
            onPress={() => onTabChange('nearby')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'nearby' && styles.activeTabText,
              ]}
            >
              Nearby
            </Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  blurContainer: {
    borderRadius: theme.radii.full,
    overflow: 'hidden',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.radii.full,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radii.full,
  },
  activeTab: {
    backgroundColor: theme.colors.surface,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
});
