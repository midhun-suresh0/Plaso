import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useNotifications } from '../context/NotificationContext';

interface PlasoBottomNavProps {
  activeTab?: 'Home' | 'Explore' | 'Create' | 'Activity' | 'Profile';
}

export const PlasoBottomNav: React.FC<PlasoBottomNavProps> = ({ activeTab = 'Home' }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { unreadCount } = useNotifications();

  const navItems: Array<{ name: string; icon: any; activeIcon: any; isCenter?: boolean }> = [
    { name: 'Home', icon: 'home-outline', activeIcon: 'home' },
    { name: 'Explore', icon: 'compass-outline', activeIcon: 'compass' },
    { name: 'Create', icon: 'add-circle', activeIcon: 'add-circle', isCenter: true },
    { name: 'Activity', icon: 'heart-outline', activeIcon: 'heart' },
    { name: 'Profile', icon: 'person-outline', activeIcon: 'person' },
  ];

  const handlePress = (tabName: string) => {
    if (tabName === 'Home') navigation.navigate('Home');
    if (tabName === 'Profile') navigation.navigate('Profile');
    if (tabName === 'Create') navigation.navigate('CreatePost');
    if (tabName === 'Explore') navigation.navigate('Search');
    if (tabName === 'Activity') navigation.navigate('Notifications');
  };

  return (
    <View style={styles.absoluteContainer}>
      <BlurView intensity={80} tint="dark" style={styles.navBar}>
        {navItems.map((item) => {
          const isActive = activeTab === item.name;
          const isCenter = item.isCenter;
          
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, isCenter && styles.centerItem]}
              onPress={() => handlePress(item.name)}
              activeOpacity={0.7}
            >
              {isCenter ? (
                <View style={styles.centerButton}>
                  <Ionicons name="add" size={32} color={theme.colors.white} />
                </View>
              ) : (
                <View style={item.name === 'Activity' ? styles.iconContainer : undefined}>
                  <Ionicons
                    name={isActive ? item.activeIcon : item.icon}
                    size={24}
                    color={isActive ? theme.colors.white : theme.colors.textSecondary}
                  />
                  {item.name === 'Activity' && unreadCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                  )}
                </View>
              )}
              {isActive && !isCenter && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteContainer: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    height: 72,
    borderRadius: theme.radii.full,
    overflow: 'hidden',
    backgroundColor: theme.colors.glass,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  centerItem: {
    flex: 1.2,
  },
  centerButton: {
    backgroundColor: theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    position: 'absolute',
    bottom: 12,
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
});
