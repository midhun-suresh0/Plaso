import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoBottomNav } from '../components/PlasoBottomNav';
import { PlasoAvatar } from '../components/PlasoAvatar';
import { PostCard } from '../components/PostCard';
import { FeedTabs } from '../components/FeedTabs';
import { FeedSkeleton } from '../components/FeedSkeleton';
import { UserSuggestionCard } from '../components/UserSuggestionCard';
import { postApi } from '../services/postApi';
import { discoveryApi, SuggestedUser } from '../services/discoveryApi';
import { Post } from '../types/post';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView } from 'react-native';

type Props = {
  navigation: NativeStackNavigationProp<any, 'Home'>;
};

export default function HomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'nearby'>('home');
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);

  const fetchFeed = async (pageNumber: number, type: 'home' | 'nearby', isRefresh = false) => {
    try {
      const response = await postApi.getFeed(type, pageNumber, 10);
      if (response.success && response.data) {
        if (isRefresh || pageNumber === 1) {
          setPosts(response.data.posts);
        } else {
          setPosts(prev => {
            // Prevent duplicates using Map
            const uniquePosts = new Map([...prev, ...response.data!.posts].map(p => [p._id, p]));
            return Array.from(uniquePosts.values());
          });
        }
        setHasMore(response.data.hasMore);
      }
    } catch (error: any) {
      if (type === 'nearby' && error.response?.data?.message?.includes('Location is required')) {
        setPosts([]);
        setHasMore(false);
      } else {
        console.error(error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const res = await discoveryApi.getSuggestedUsers();
      if (res.success && res.data) {
        setSuggestions(res.data);
      }
    } catch (e) {
      console.error('Failed to load suggestions', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFeed(1, activeTab, true);
      loadSuggestions();
    }, [activeTab])
  );

  const handleTabChange = (tab: 'home' | 'nearby') => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setLoading(true);
    setPage(1);
    // fetchFeed handles the actual fetch via the useFocusEffect dependency or directly:
    fetchFeed(1, tab, true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchFeed(1, activeTab, true);
    loadSuggestions();
  };

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage, activeTab);
    }
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetails', { post });
  };

  const handleCommentPress = (post: Post) => {
    navigation.navigate('PostDetails', { post });
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await postApi.deletePost(postId);
            setPosts(posts.filter(p => p._id !== postId));
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete post');
          }
        }
      }
    ]);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>PLASO</Text>
      <View style={styles.headerActions}>
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={12} color={theme.colors.primary} />
          <Text style={styles.locationText}>
            {user?.locationPrivacy === 'PRIVATE' ? 'Private' : 'Near you'}
          </Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <PlasoAvatar uri={user?.profileImage} name={user?.name} size="sm" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;
    
    if (activeTab === 'nearby' && (!user?.location || user.location.coordinates.length !== 2)) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Location Required</Text>
          <Text style={styles.emptyText}>Enable location in your profile to discover nearby posts.</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.emptyButtonText}>Update Location</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="compass-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>
          {activeTab === 'nearby' ? 'Nothing happening nearby yet.' : 'Your feed is empty.'}
        </Text>
        <Text style={styles.emptyText}>
          {activeTab === 'nearby' 
            ? "Be the first to share what's happening around you." 
            : 'Check out the Nearby tab or create a post.'}
        </Text>
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => navigation.navigate('CreatePost')}
        >
          <Text style={styles.emptyButtonText}>Create a post</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSuggestions = () => {
    if (activeTab !== 'home' || suggestions.length === 0) return null;
    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>People You May Know</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
          {suggestions.map(s => (
            <UserSuggestionCard 
              key={s._id} 
              user={s} 
              onFollow={() => setSuggestions(prev => prev.filter(user => user._id !== s._id))} 
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderBusinessBanner = () => {
    return (
      <TouchableOpacity 
        style={styles.businessBanner}
        onPress={() => navigation.navigate('BusinessDiscovery')}
        activeOpacity={0.8}
      >
        <View style={styles.businessBannerContent}>
          <Ionicons name="storefront" size={24} color={theme.colors.surface} />
          <View style={styles.businessBannerTextContainer}>
            <Text style={styles.businessBannerTitle}>Explore Local Businesses</Text>
            <Text style={styles.businessBannerDesc}>Discover cafes, shops, and services near you</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.surface} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <PlasoScreen>
      <View style={styles.container}>
        {renderHeader()}
        <FeedTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {loading && posts.length === 0 ? (
          <FeedSkeleton />
        ) : (
          <FlatList
            ListHeaderComponent={
              <>
                {renderBusinessBanner()}
                {renderSuggestions()}
              </>
            }
            data={posts}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <PostCard 
              post={item} 
              onPress={handlePostPress} 
              onCommentPress={handleCommentPress}
              onDelete={handleDeletePost}
            />
          )}
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
          ListEmptyComponent={renderEmptyState}
            ListFooterComponent={
              hasMore && posts.length > 0 ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : null
            }
          />
        )}

        <PlasoBottomNav activeTab="Home" />
      </View>
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 32, 110, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: theme.spacing.md,
  },
  locationText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  iconButton: {
    marginRight: theme.spacing.md,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: 100, // padding for bottom nav
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.full,
  },
  emptyButtonText: {
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  footerLoader: {
    paddingVertical: theme.spacing.lg,
  },
  suggestionsContainer: {
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  suggestionsScroll: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  businessBanner: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
  },
  businessBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessBannerTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  businessBannerTitle: {
    color: theme.colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  businessBannerDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  }
});
