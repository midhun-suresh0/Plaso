import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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

  const handlePress = () => {
    navigation.navigate('UserProfile', { userId: user._id });
  };

  const handleFollow = async () => {
    try {
      await userApi.followUser(user._id);
      if (onFollow) onFollow();
    } catch (error) {
      console.error('Failed to follow user', error);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <PlasoAvatar uri={user.profileImage} name={user.name} size="lg" />
      <Text style={styles.name} numberOfLines={1}>{user.name}</Text>
      <Text style={styles.username} numberOfLines={1}>
        {user.username ? `@${user.username}` : ''}
      </Text>
      {user.sharedInterests > 0 && (
        <Text style={styles.contextText}>
          {user.sharedInterests} shared interest{user.sharedInterests > 1 ? 's' : ''}
        </Text>
      )}
      <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
        <Text style={styles.followText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 140,
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  contextText: {
    color: theme.colors.primary,
    fontSize: 10,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  followButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
  },
  followText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
