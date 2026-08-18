import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoBottomNav } from '../components/PlasoBottomNav';
import { PostCard } from '../components/PostCard';
import { SearchResultUser } from '../components/SearchResultUser';
import { theme } from '../constants/theme';
import { searchApi, SearchUser } from '../services/searchApi';
import { Post } from '../types/post';

type Props = {
  navigation: NativeStackNavigationProp<any, 'Search'>;
};

type SearchTab = 'ALL' | 'PEOPLE' | 'POSTS';

export default function SearchScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('ALL');
  
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

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
    }
  }, [debouncedQuery, activeTab]);

  const performSearch = async (searchQuery: string, tab: SearchTab) => {
    setLoading(true);
    setSearched(true);
    try {
      if (tab === 'ALL' || tab === 'PEOPLE') {
        const userRes = await searchApi.searchUsers(searchQuery, 1, 10);
        if (userRes.success && userRes.data) {
          setUsers(userRes.data.users);
        }
      }
      
      if (tab === 'ALL' || tab === 'POSTS') {
        const postRes = await searchApi.searchPosts(searchQuery, 1, 10);
        if (postRes.success && postRes.data) {
          setPosts(postRes.data.posts);
        }
      }
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (user: SearchUser) => {
    navigation.navigate('UserProfile', { userId: user._id });
  };

  const handlePostPress = (post: Post) => {
    navigation.navigate('PostDetails', { post });
  };

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
    if (loading) return null;
    
    if (!searched) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Search Plaso</Text>
          <Text style={styles.emptyText}>Find people and posts on the platform.</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptyText}>Try searching with different keywords.</Text>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (searched && users.length === 0 && posts.length === 0) {
      return renderEmptyState();
    }

    const data: any[] = [];
    if (activeTab === 'ALL' || activeTab === 'PEOPLE') {
      if (users.length > 0) {
        if (activeTab === 'ALL') data.push({ type: 'header', title: 'People' });
        users.forEach(u => data.push({ type: 'user', data: u }));
      }
    }

    if (activeTab === 'ALL' || activeTab === 'POSTS') {
      if (posts.length > 0) {
        if (activeTab === 'ALL') data.push({ type: 'header', title: 'Posts' });
        posts.forEach(p => data.push({ type: 'post', data: p }));
      }
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item, index) => `${item.type}-${item.data?._id || index}`}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return <Text style={styles.sectionHeader}>{item.title}</Text>;
          }
          if (item.type === 'user') {
            return <SearchResultUser user={item.data} onPress={handleUserPress} />;
          }
          if (item.type === 'post') {
            return <PostCard post={item.data} onPress={handlePostPress} />;
          }
          return null;
        }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
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
    paddingBottom: 100, // For Bottom Nav
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background,
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
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
});
