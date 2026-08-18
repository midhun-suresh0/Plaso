import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoAvatar } from '../components/PlasoAvatar';
import { PostCard } from '../components/PostCard';
import { FeedSkeleton } from '../components/FeedSkeleton';
import { userApi } from '../services/userApi';
import { postApi } from '../services/postApi';
import { Post } from '../types/post';

type Props = {
  navigation: NativeStackNavigationProp<any, 'UserProfile'>;
  route: RouteProp<any, 'UserProfile'>;
};

export default function UserProfileScreen({ navigation, route }: Props) {
  const { userId } = route.params as { userId: string };
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProfileAndPosts = async (pageNumber: number, isRefresh = false) => {
    try {
      if (pageNumber === 1) {
        const profileRes = await userApi.getPublicProfile(userId);
        if (profileRes.success) {
          setProfile(profileRes.data);
        }
      }

      const postsRes = await postApi.getUserPosts(userId, pageNumber, 10);
      if (postsRes.success && postsRes.data) {
        if (isRefresh || pageNumber === 1) {
          setPosts(postsRes.data.posts);
        } else {
          setPosts(prev => {
            const uniquePosts = new Map([...prev, ...postsRes.data!.posts].map(p => [p._id, p]));
            return Array.from(uniquePosts.values());
          });
        }
        setHasMore(postsRes.data.hasMore);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfileAndPosts(1, true);
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchProfileAndPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProfileAndPosts(nextPage);
    }
  };

  const handleToggleFollow = async () => {
    if (!profile) return;
    
    const isCurrentlyFollowing = profile.isFollowing;
    
    // Optimistic UI update
    setProfile({
      ...profile,
      isFollowing: !isCurrentlyFollowing,
      followerCount: isCurrentlyFollowing ? profile.followerCount - 1 : profile.followerCount + 1
    });

    try {
      if (isCurrentlyFollowing) {
        await userApi.unfollowUser(userId);
      } else {
        await userApi.followUser(userId);
      }
    } catch (error: any) {
      // Revert on failure
      setProfile({
        ...profile,
        isFollowing: isCurrentlyFollowing,
        followerCount: isCurrentlyFollowing ? profile.followerCount : profile.followerCount - 1
      });
      Alert.alert('Error', error.response?.data?.message || 'Failed to update follow status');
    }
  };

  const renderHeader = () => {
    if (!profile) return null;

    return (
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        
        <PlasoAvatar uri={profile.profileImage} name={profile.name} size="hero" style={styles.heroAvatar} />
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.username}>{profile.username ? `@${profile.username}` : ''}</Text>
        
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.followerCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.postCount || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {currentUser?._id !== userId && (
          <TouchableOpacity 
            style={[styles.followButton, profile.isFollowing && styles.followingButton]}
            onPress={handleToggleFollow}
          >
            <Text style={[styles.followButtonText, profile.isFollowing && styles.followingButtonText]}>
              {profile.isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.badgesContainer}>
            {profile.interests.map((interest: string, index: number) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{interest}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading && !profile) {
    return (
      <PlasoScreen>
        <FeedSkeleton />
      </PlasoScreen>
    );
  }

  return (
    <PlasoScreen>
      <FlatList
        data={posts}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onPress={(post) => navigation.navigate('PostDetails', { post })} 
            onCommentPress={(post) => navigation.navigate('PostDetails', { post })}
          />
        )}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No posts to show</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasMore && posts.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null
        }
      />
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
    marginBottom: theme.spacing.lg,
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
  followButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    borderRadius: theme.radii.full,
    marginBottom: theme.spacing.xl,
    minWidth: 150,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  followButtonText: {
    color: theme.colors.surface,
    fontWeight: 'bold',
    fontSize: theme.typography.sizes.md,
  },
  followingButtonText: {
    color: theme.colors.text,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'center',
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
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    marginTop: theme.spacing.md,
  },
  footerLoader: {
    paddingVertical: theme.spacing.lg,
  },
});
