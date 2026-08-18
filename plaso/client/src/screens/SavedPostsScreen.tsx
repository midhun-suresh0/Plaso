import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { PostCard } from '../components/PostCard';
import { FeedSkeleton } from '../components/FeedSkeleton';
import { postApi } from '../services/postApi';
import { Post } from '../types/post';
import { useFocusEffect } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any, 'SavedPosts'>;
};

export default function SavedPostsScreen({ navigation }: Props) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchSavedPosts = async (pageNumber: number, isRefresh = false) => {
    try {
      const response = await postApi.getSavedPosts(pageNumber, 10);
      if (response.success && response.data) {
        if (isRefresh || pageNumber === 1) {
          setPosts(response.data.posts);
        } else {
          setPosts(prev => {
            const uniquePosts = new Map([...prev, ...response.data!.posts].map(p => [p._id, p]));
            return Array.from(uniquePosts.values());
          });
        }
        setHasMore(response.data.hasMore);
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to load saved posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSavedPosts(1, true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchSavedPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSavedPosts(nextPage);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Saved Posts</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bookmark-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>No saved posts yet.</Text>
        <Text style={styles.emptyText}>Posts you save will appear here.</Text>
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.emptyButtonText}>Explore Posts</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <PlasoScreen>
      <View style={styles.container}>
        {renderHeader()}
        
        {loading && posts.length === 0 ? (
          <FeedSkeleton />
        ) : (
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  iconButton: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.radii.full,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
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
});
