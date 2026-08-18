import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Comment } from '../types/post';
import { theme } from '../constants/theme';
import { PlasoAvatar } from './PlasoAvatar';
import { useAuth } from '../context/AuthContext';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface CommentItemProps {
  comment: Comment;
  onDelete?: (commentId: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, onDelete }) => {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const isOwner = user?._id === comment.author._id || user?.id === comment.author._id;

  const handleAuthorPress = () => {
    if (isOwner) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('UserProfile', { userId: comment.author._id });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleAuthorPress}>
        <PlasoAvatar uri={comment.author.profileImage} name={comment.author.name} size="sm" />
      </TouchableOpacity>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAuthorPress}>
            <Text style={styles.name}>{comment.author.name}</Text>
          </TouchableOpacity>
          <Text style={styles.meta}>
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </Text>
        </View>
        <Text style={styles.content}>{comment.content}</Text>
      </View>
      {isOwner && onDelete && (
        <TouchableOpacity onPress={() => onDelete(comment._id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  contentContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderTopLeftRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xs,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: 'bold',
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
  content: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    lineHeight: 20,
  },
  deleteButton: {
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
    padding: theme.spacing.xs,
  },
});
