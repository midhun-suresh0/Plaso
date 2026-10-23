import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PlasoAvatar } from './PlasoAvatar';
import { theme } from '../constants/theme';
import { SuggestedUser } from '../services/discoveryApi';
import { userApi } from '../services/userApi';

interface UserSuggestionCardProps {
  user: SuggestedUser;
  onFollow?: () => void;
}

export const UserSuggestionCard: React.FC<UserSuggestionCardProps> = ({ user, onFollow }) => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const displayName = user.name || user.username || 'Plaso User';

  const handlePress = () => {
    navigation.navigate('UserProfile', { userId: user._id });
  };

  const handleFollow = async () => {
    if (loading || following) return;
    try {
      setLoading(true);
      setFollowing(true);
      await userApi.followUser(user._id);
      if (onFollow) {
        setTimeout(() => {
          onFollow();
        }, 500);
      }
    } catch (error) {
      setFollowing(false);
      console.error('Failed to follow user', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.topSection}>
        <PlasoAvatar uri={user.profileImage} name={displayName} size="lg" />
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        <Text style={styles.username} numberOfLines={1}>
          {user.username ? `@${user.username}` : '@user'}
        </Text>
        <Text style={styles.contextText} numberOfLines={1}>
          {user.sharedInterests > 0 
            ? `${user.sharedInterests} shared interest${user.sharedInterests > 1 ? 's' : ''}`
            : 'Suggested for you'}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.followButton, following && styles.followingButton]} 
        onPress={handleFollow}
        disabled={loading || following}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={[styles.followText, following && styles.followingText]}>
            {following ? 'Following' : 'Follow'}
          </Text>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    minHeight: 195,
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  name: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  username: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  contextText: {
    color: theme.colors.primary,
    fontSize: 11,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  followButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
    borderRadius: theme.radii.full,
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  followText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  followingText: {
    color: theme.colors.primary,
  },
});

