import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '../types/post';
import { theme } from '../constants/theme';
import { PlasoAvatar } from './PlasoAvatar';
import { postApi } from '../services/postApi';
import { useAuth } from '../context/AuthContext';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface PostCardProps {
  post: Post;
  onPress?: (post: Post) => void;
  onCommentPress?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  disabled?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPress, onCommentPress, onDelete, disabled }) => {
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);

  const handleLike = async () => {
    // Optimistic UI update
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      if (newIsLiked) {
        await postApi.likePost(post._id);
      } else {
        await postApi.unlikePost(post._id);
      }
    } catch (error) {
      // Rollback on failure
      setIsLiked(!newIsLiked);
      setLikeCount(prev => !newIsLiked ? prev + 1 : prev - 1);
    }
  };

  const handleSave = async () => {
    // Optimistic UI update
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);

    try {
      if (newIsSaved) {
        await postApi.savePost(post._id);
      } else {
        await postApi.unsavePost(post._id);
      }
    } catch (error) {
      // Rollback on failure
      setIsSaved(!newIsSaved);
    }
  };

  const isOwner = user?._id === post.author._id || user?.id === post.author._id; // Accommodating different user id formats
  const hasLocation = !!post.locationName || post.distanceKm !== undefined || !!post.distance;
  const distanceStr = post.distanceKm !== undefined 
    ? `${post.distanceKm} km away`
    : post.distance 
      ? `${(post.distance / 1000).toFixed(1)} km away` 
      : '';
  const locationText = post.locationName || distanceStr;

  const handleAuthorPress = () => {
    if (isOwner) {
      navigation.navigate('Profile');
    } else {
      navigation.navigate('UserProfile', { userId: post.author._id });
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.authorInfo} onPress={handleAuthorPress}>
          <PlasoAvatar uri={post.author.profileImage} name={post.author.name} size="sm" />
          <View style={styles.authorText}>
            <Text style={styles.name}>{post.author.name}</Text>
            <Text style={styles.meta}>
              {post.author.username ? `@${post.author.username} • ` : ''}
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </Text>
          </View>
        </TouchableOpacity>
        {isOwner && onDelete && !disabled && (
          <TouchableOpacity onPress={() => onDelete(post._id)} style={styles.menuButton}>
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity activeOpacity={disabled ? 1 : 0.8} onPress={() => !disabled && onPress && onPress(post)}>
        {hasLocation && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={12} color={theme.colors.primary} />
            <Text style={styles.locationText}>{locationText}</Text>
          </View>
        )}

        {post.content && (
          <Text style={styles.content} numberOfLines={4}>
            {post.content}
          </Text>
        )}

        {post.media && post.media.length > 0 && (
          <Image source={{ uri: post.media[0] }} style={styles.image} />
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike} disabled={disabled}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? theme.colors.primary : theme.colors.textSecondary} 
          />
          <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
            {likeCount > 0 ? likeCount : 'Like'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => !disabled && onCommentPress && onCommentPress(post)}
          disabled={disabled}
        >
          <Ionicons name="chatbubble-outline" size={22} color={theme.colors.textSecondary} />
          <Text style={styles.actionText}>
            {post.commentCount > 0 ? post.commentCount : 'Comment'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSave} disabled={disabled}>
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={22} 
            color={isSaved ? theme.colors.primary : theme.colors.textSecondary} 
          />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.actionButtonEnd} disabled={disabled}>
          <Ionicons name="share-outline" size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    marginLeft: theme.spacing.md,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    marginTop: 2,
  },
  menuButton: {
    padding: theme.spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    backgroundColor: 'rgba(255, 32, 110, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radii.full,
  },
  locationText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  content: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.divider,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.xl,
  },
  actionButtonEnd: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  actionTextActive: {
    color: theme.colors.primary,
  },
});
