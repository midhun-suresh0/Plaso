import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoBottomNav } from '../components/PlasoBottomNav';
import { PostCard } from '../components/PostCard';
import { SearchResultUser } from '../components/SearchResultUser';
import { UserSuggestionCard } from '../components/UserSuggestionCard';
import { theme } from '../constants/theme';
import { searchApi, SearchUser } from '../services/searchApi';
import { recommendationApi } from '../services/api/recommendationApi';
import { discoveryApi, SuggestedUser } from '../services/discoveryApi';
import { Post } from '../types/post';

type Props = {
  navigation: NativeStackNavigationProp<any, 'Search'>;
};

type SearchTab = 'ALL' | 'PEOPLE' | 'POSTS';

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('ALL');

  // Search Results
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // Default Explore Data (shown when search query is empty)
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false);

  // Load default explore content (suggested people & trending posts)
  const loadDefaultExplore = async () => {
    try {
      const [usersRes, trendingRes, suggestionsRes] = await Promise.allSettled([
        discoveryApi.getSuggestedUsers(15),
        recommendationApi.getTrending(),
        recommendationApi.getSearchSuggestions(''),
      ]);

      if (usersRes.status === 'fulfilled' && usersRes.value.success && usersRes.value.data) {
        setSuggestedUsers(usersRes.value.data);
      }
      if (trendingRes.status === 'fulfilled' && trendingRes.value.success && trendingRes.value.data) {
        const trendingList = Array.isArray(trendingRes.value.data)
          ? trendingRes.value.data
          : (trendingRes.value.data.trendingPosts || trendingRes.value.data.posts || []);
        setTrendingPosts(trendingList);
      }
      if (suggestionsRes.status === 'fulfilled' && suggestionsRes.value.success && suggestionsRes.value.data) {
        setSuggestions(suggestionsRes.value.data || []);
      }
    } catch (error) {
      console.error('Failed to load explore content:', error);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDefaultExplore();
  }, []);

  // Debounce the search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search when debounced query or tab changes
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      performSearch(debouncedQuery, activeTab);
    } else {
      setUsers([]);
      setPosts([]);
      setSearched(false);
      setLoading(false);
    }
  }, [debouncedQuery, activeTab]);

  const performSearch = async (searchQuery: string, tab: SearchTab) => {
    setLoading(true);
    setSearched(true);
    try {
      if (tab === 'ALL' || tab === 'PEOPLE') {
        const userRes = await searchApi.searchUsers(searchQuery, 1, 15);
        if (userRes.success && userRes.data) {
          setUsers(userRes.data.users);
        }
      }

      if (tab === 'ALL' || tab === 'POSTS') {
        const postRes = await searchApi.searchPosts(searchQuery, 1, 15);
        if (postRes.success && postRes.data) {
          setPosts(postRes.data.posts);
        }
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (debouncedQuery.trim().length > 0) {
      performSearch(debouncedQuery, activeTab);
    } else {
      loadDefaultExplore();
    }
  };

  const handleUserPress = (user: SearchUser | SuggestedUser) => {
    navigation.navigate('UserProfile', { userId: user._id });
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetails', { post });
  };

  const isSearching = debouncedQuery.trim().length > 0;

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(['ALL', 'PEOPLE', 'POSTS'] as SearchTab[]).map(tab => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
            {tab === 'ALL' ? 'All' : tab === 'PEOPLE' ? 'People' : 'Posts'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => {
    if (loading || initialLoading) return null;

    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No results found</Text>
          <Text style={styles.emptyText}>
            No results found for "{debouncedQuery}". Try searching with different keywords.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="compass-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>Explore Plaso</Text>
        <Text style={styles.emptyText}>Connect with people and discover trending posts.</Text>
      </View>
    );
  };

  const buildListData = () => {
    const list: any[] = [];

    if (isSearching) {
      // Search Results Mode
      if (activeTab === 'ALL' || activeTab === 'PEOPLE') {
        if (users.length > 0) {
          if (activeTab === 'ALL') {
            list.push({ id: 'header-users', type: 'header', title: 'People' });
          }
          users.forEach(u => list.push({ id: `user-${u._id}`, type: 'user', data: u }));
        }
      }

      if (activeTab === 'ALL' || activeTab === 'POSTS') {
        if (posts.length > 0) {
          if (activeTab === 'ALL') {
            list.push({ id: 'header-posts', type: 'header', title: 'Posts' });
          }
          posts.forEach(p => list.push({ id: `post-${p._id}`, type: 'post', data: p }));
        }
      }
    } else {
      // Default Explore Mode (when search input is empty)
      if (activeTab === 'ALL') {
        // Suggested chips if available
        if (suggestions.length > 0) {
          list.push({ id: 'chips-suggestions', type: 'chips', data: suggestions });
        }

        // Horizontal Discover People Carousel
        if (suggestedUsers.length > 0) {
          list.push({
            id: 'header-explore-people',
            type: 'header',
            title: 'Discover People',
            actionText: 'See all',
            onAction: () => setActiveTab('PEOPLE'),
          });
          list.push({
            id: 'carousel-users',
            type: 'carousel-users',
            data: suggestedUsers,
          });
        }

        // Trending Posts Section
        if (trendingPosts.length > 0) {
          list.push({
            id: 'header-explore-posts',
            type: 'header',
            title: 'Trending Posts',
          });
          trendingPosts.forEach(p => list.push({ id: `trending-post-${p._id}`, type: 'post', data: p }));
        }
      } else if (activeTab === 'PEOPLE') {
        if (suggestedUsers.length > 0) {
          list.push({
            id: 'header-suggested-people',
            type: 'header',
            title: 'Suggested For You',
          });
          suggestedUsers.forEach(u => list.push({ id: `suggested-user-${u._id}`, type: 'user', data: u }));
        }
      } else if (activeTab === 'POSTS') {
        if (trendingPosts.length > 0) {
          list.push({
            id: 'header-trending-posts',
            type: 'header',
            title: 'Trending Posts',
          });
          trendingPosts.forEach(p => list.push({ id: `trending-post-${p._id}`, type: 'post', data: p }));
        }
      }
    }

    return list;
  };

  const renderContent = () => {
    if ((loading || initialLoading) && !refreshing) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    const listData = buildListData();

    if (listData.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {renderEmptyState()}
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>{item.title}</Text>
                {item.actionText && (
                  <TouchableOpacity onPress={item.onAction}>
                    <Text style={styles.seeAllText}>{item.actionText}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          if (item.type === 'chips') {
            return (
              <View style={styles.chipsWrapper}>
                <Text style={styles.chipsLabel}>Suggested searches</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {item.data.map((s: any, idx: number) => {
                    const text = typeof s === 'string' ? s : s.text || s.query;
                    if (!text) return null;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.chip}
                        onPress={() => {
                          setQuery(text);
                          setDebouncedQuery(text);
                        }}
                      >
                        <Ionicons name="search-outline" size={14} color={theme.colors.textSecondary} style={{ marginRight: 6 }} />
                        <Text style={styles.chipText}>{text}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            );
          }

          if (item.type === 'carousel-users') {
            return (
              <View style={styles.carouselContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselScroll}>
                  {item.data.map((u: SuggestedUser) => (
                    <UserSuggestionCard
                      key={u._id}
                      user={u}
                      onFollow={() => {
                        // Optimistically refresh suggestions
                        loadDefaultExplore();
                      }}
                    />
                  ))}
                </ScrollView>
              </View>
            );
          }

          if (item.type === 'user') {
            return <SearchResultUser user={item.data} onPress={handleUserPress} />;
          }

          if (item.type === 'post') {
            return (
              <PostCard
                post={item.data}
                onPress={handlePostPress}
                onCommentPress={handlePostPress}
              />
            );
          }

          return null;
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    );
  };

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Plaso..."
            placeholderTextColor={theme.colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={{ marginLeft: theme.spacing.md }} onPress={() => navigation.navigate('MapDiscovery')}>
          <Ionicons name="map-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {renderTabs()}

      {renderContent()}

      <PlasoBottomNav activeTab="Explore" />
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.radii.full,
    paddingHorizontal: theme.spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  listContent: {
    paddingBottom: 110, // For Bottom Nav
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: theme.spacing.xl,
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
    lineHeight: 22,
  },
  chipsWrapper: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  chipsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  chipsScroll: {
    paddingVertical: theme.spacing.xs,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHighlight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 6,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  carouselContainer: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  carouselScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
});
