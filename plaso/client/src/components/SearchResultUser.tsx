import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlasoAvatar } from './PlasoAvatar';
import { theme } from '../constants/theme';
import { SearchUser } from '../services/searchApi';

interface SearchResultUserProps {
  user: SearchUser;
  onPress: (user: SearchUser) => void;
}

export const SearchResultUser: React.FC<SearchResultUserProps> = ({ user, onPress }) => {
  const displayName = user.name || (user.username ? `@${user.username}` : 'User');

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress(user)}
      activeOpacity={0.7}
    >
      <PlasoAvatar uri={user.profileImage} name={displayName} size="md" />
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{displayName}</Text>
        {user.username && <Text style={styles.username}>@{user.username}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoContainer: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  username: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
