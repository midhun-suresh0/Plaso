import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoInput } from '../components/PlasoInput';
import { ListingCard } from '../components/ListingCard';
import { marketplaceApi } from '../services/marketplaceApi';
import { MarketplaceListing, ListingType } from '../types/marketplace';
import { MARKETPLACE_CATEGORIES } from '../constants/marketplaceCategories';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce'; // Assuming this exists or I'll just use a simple timeout for now

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Marketplace'>;
};

export default function MarketplaceScreen({ navigation }: Props) {
  const { user } = useAuth();
  
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<ListingType | 'ALL'>('ALL');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchListings = async (pageNumber: number, isRefresh = false) => {
    try {
      if (!user?.location || user.location.coordinates.length < 2) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const [longitude, latitude] = user.location.coordinates;
      
      const response = await marketplaceApi.getNearbyListings(
        longitude,
        latitude,
        pageNumber,
        10,
        {
          type: activeType !== 'ALL' ? activeType : undefined,
          category: activeCategory || undefined,
          search: debouncedSearch || undefined,
        }
      );

      if (response.success && response.data) {
        if (isRefresh || pageNumber === 1) {
          setListings(response.data.listings);
        } else {
          setListings(prev => {
            const unique = new Map([...prev, ...response.data!.listings].map(l => [l._id, l]));
            return Array.from(unique.values());
          });
        }
        setHasMore(pageNumber < response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch marketplace listings', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchListings(1, true);
    }, [activeType, activeCategory, debouncedSearch, user?.location])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchListings(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchListings(nextPage);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Local Marketplace</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchInput}>
        <PlasoInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search products & services..."
          icon="search"
        />
      </View>
      
      <View style={styles.typeTabs}>
        {(['ALL', ListingType.PRODUCT, ListingType.SERVICE] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeTab, activeType === type && styles.activeTypeTab]}
            onPress={() => {
              setActiveType(type);
              setPage(1);
            }}
          >
            <Text style={[styles.typeTabText, activeType === type && styles.activeTypeTabText]}>
              {type === 'ALL' ? 'All' : type === ListingType.PRODUCT ? 'Products' : 'Services'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        <TouchableOpacity
          style={[styles.categoryChip, !activeCategory && styles.activeCategoryChip]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[styles.categoryChipText, !activeCategory && styles.activeCategoryChipText]}>All Categories</Text>
        </TouchableOpacity>
        
        {MARKETPLACE_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryChip, activeCategory === category.id && styles.activeCategoryChip]}
            onPress={() => setActiveCategory(category.id)}
          >
            <Text style={[styles.categoryChipText, activeCategory === category.id && styles.activeCategoryChipText]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;
    
    if (!user?.location || user.location.coordinates.length < 2) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>Location Required</Text>
          <Text style={styles.emptyText}>Enable location to discover nearby products and services.</Text>
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
        <Ionicons name="basket-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>No listings found</Text>
        <Text style={styles.emptyText}>Try adjusting your search or filters.</Text>
      </View>
    );
  };

  return (
    <PlasoScreen>
      {renderHeader()}
      
      <FlatList
        ListHeaderComponent={renderFilters()}
        data={listings}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <ListingCard 
            listing={item} 
            onPress={(listing) => navigation.navigate('ListingDetails', { listingId: listing._id })}
            style={styles.cardMargin}
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
          hasMore && listings.length > 0 ? (
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  filtersContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  searchInput: {
    marginBottom: theme.spacing.md,
  },
  typeTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: 4,
    marginBottom: theme.spacing.md,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.radii.md,
  },
  activeTypeTab: {
    backgroundColor: theme.colors.primary,
  },
  typeTabText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  activeTypeTabText: {
    color: theme.colors.surface,
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeCategoryChip: {
    backgroundColor: 'rgba(255, 32, 110, 0.1)',
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeCategoryChipText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 40,
  },
  cardMargin: {
    marginHorizontal: theme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textLight,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radii.full,
  },
  emptyButtonText: {
    color: theme.colors.surface,
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
  },
});
