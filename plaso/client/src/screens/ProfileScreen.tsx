import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants/theme';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoAvatar } from '../components/PlasoAvatar';
import { PlasoCard } from '../components/PlasoCard';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

type Props = {
  navigation: NativeStackNavigationProp<any, 'Profile'>;
};

export default function ProfileScreen({ navigation }: Props) {
  const { user, checkAuth, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const refreshProfile = async () => {
    setLoading(true);
    await checkAuth();
    setLoading(false);
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
  };

  return (
    <PlasoScreen>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshProfile} tintColor={theme.colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.iconButton}>
              <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <PlasoAvatar uri={user?.profileImage} name={user?.name} size="hero" hasStory={true} style={styles.heroAvatar} />
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.username}>{user?.username ? `@${user.username}` : 'No username set'}</Text>
          
          <Text style={styles.bio}>{user?.bio || 'Add a bio to tell people about yourself.'}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.followerCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.postCount || 0}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Interests</Text>
            {(!user?.interests || user.interests.length === 0) && (
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                <Text style={styles.editLink}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.badgesContainer}>
            {user?.interests && user.interests.length > 0 ? (
              user.interests.map((interest, index) => (
                <View key={index} style={styles.badge}>
                  <Text style={styles.badgeText}>{interest}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>You haven't added any interests yet.</Text>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discovery Settings</Text>
          </View>
          <PlasoCard glass style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Privacy</Text>
                <Text style={styles.settingValue}>{user?.locationPrivacy || 'NEARBY'}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
              <Ionicons name="radio-outline" size={20} color={theme.colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Radius</Text>
                <Text style={styles.settingValue}>{user?.discoveryRadius || 5} km</Text>
              </View>
            </View>

            <View style={styles.divider} />
            
            <View style={styles.settingRow}>
              <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Location</Text>
                <Text style={styles.settingValue}>
                  {user?.location?.coordinates ? 'Set' : 'Not set'}
                </Text>
              </View>
            </View>
          </PlasoCard>

          {((user?.role as any) === 'BUSINESS_OWNER' as any || (user?.role as any) === 'ADMIN' as any) && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Business Management</Text>
              </View>
              <PlasoCard glass style={styles.settingsCard}>
                {(user?.role as any) === 'BUSINESS_OWNER' as any && (
                  <>
                    <TouchableOpacity 
                      style={styles.settingRow} 
                      onPress={() => navigation.navigate('BusinessDashboard')}
                    >
                      <Ionicons name="storefront-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.settingTextContainer}>
                        <Text style={styles.settingLabel}>My Business</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  </>
                )}
                
                {(user?.role as any) === 'ADMIN' as any && (
                  <>
                    {(user?.role as any) === 'BUSINESS_OWNER' as any && <View style={styles.divider} />}
                    <TouchableOpacity 
                      style={styles.settingRow} 
                      onPress={() => navigation.navigate('AdminBusinesses')}
                    >
                      <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.primary} />
                      <View style={styles.settingTextContainer}>
                        <Text style={styles.settingLabel}>Review Businesses</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                      </View>
                    </TouchableOpacity>
                  </>
                )}
              </PlasoCard>
            </>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity</Text>
          </View>
          <PlasoCard glass style={styles.settingsCard}>
            <TouchableOpacity 
              style={styles.settingRow} 
              onPress={() => navigation.navigate('SavedPosts')}
            >
              <Ionicons name="bookmark-outline" size={20} color={theme.colors.primary} />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Saved Posts</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </PlasoCard>

          <View style={styles.logoutContainer}>
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  iconButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.radii.full,
  },
  heroAvatar: {
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  username: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  bio: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.radii.full,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    width: '100%',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  editLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  badge: {
    backgroundColor: 'rgba(255, 32, 110, 0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 32, 110, 0.3)',
  },
  badgeText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: theme.typography.sizes.sm,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontStyle: 'italic',
  },
  settingsCard: {
    padding: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  settingTextContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
  },
  settingValue: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  logoutContainer: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
    paddingBottom: theme.spacing.xl,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: theme.colors.error,
    fontWeight: 'bold',
    fontSize: theme.typography.sizes.md,
    marginLeft: theme.spacing.sm,
  },
});
