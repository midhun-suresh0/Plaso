import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { ListingCard } from '../components/ListingCard';
import { marketplaceApi } from '../services/marketplaceApi';
import { MarketplaceListing } from '../types/marketplace';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BusinessListings'>;
};

export default function BusinessListingsScreen({ navigation }: Props) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchListings = async (pageNumber: number, isRefresh = false) => {
    try {
      const response = await marketplaceApi.getOwnerListings(pageNumber, 20);
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
      console.error('Failed to fetch business listings', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchListings(1, true);
    }, [])
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

  const handleToggleStatus = async (listing: MarketplaceListing) => {
    try {
      const newStatus = !listing.isActive;
      const response = await marketplaceApi.updateListingStatus(listing._id, newStatus);
      if (response.success) {
        setListings(prev => prev.map(l => l._id === listing._id ? { ...l, isActive: newStatus } : l));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update listing status');
    }
  };

  const handleDelete = (listingId: string) => {
    Alert.alert('Delete Listing', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            await marketplaceApi.deleteListing(listingId);
            setListings(prev => prev.filter(l => l._id !== listingId));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete listing');
          }
        }
      }
    ]);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Listings</Text>
      <TouchableOpacity onPress={() => navigation.navigate('CreateListing', { businessId: listings[0]?.business._id || '' })}>
        <Ionicons name="add" size={28} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: MarketplaceListing }) => (
    <View style={styles.listingContainer}>
      <View style={[styles.statusBanner, { backgroundColor: item.isActive ? theme.colors.success + '20' : theme.colors.error + '20' }]}>
        <View style={[styles.statusDot, { backgroundColor: item.isActive ? theme.colors.success : theme.colors.error }]} />
        <Text style={[styles.statusText, { color: item.isActive ? theme.colors.success : theme.colors.error }]}>
          {item.isActive ? 'Active - Visible in Marketplace' : 'Inactive - Hidden from Marketplace'}
        </Text>
      </View>
      
      <ListingCard 
        listing={item} 
        onPress={() => navigation.navigate('ListingDetails', { listingId: item._id })} 
        style={styles.card}
      />
      
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('EditListing', { listing: item })}>
          <Ionicons name="pencil-outline" size={20} color={theme.colors.textLight} />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggleStatus(item)}>
          <Ionicons name={item.isActive ? "eye-off-outline" : "eye-outline"} size={20} color={theme.colors.textLight} />
          <Text style={styles.actionBtnText}>{item.isActive ? 'Deactivate' : 'Activate'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionBtn, { borderRightWidth: 0 }]} onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          <Text style={[styles.actionBtnText, { color: theme.colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="basket-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>No listings yet</Text>
        <Text style={styles.emptyText}>Create your first product or service to start selling on Plaso.</Text>
        <TouchableOpacity 
          style={styles.emptyButton}
          onPress={() => navigation.navigate('CreateListing', { businessId: '' })}
        >
          <Text style={styles.emptyButtonText}>Create Listing</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <PlasoScreen>
      {renderHeader()}
      <FlatList
        data={listings}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
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
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  listingContainer: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginBottom: 0,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  actionsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.radii.lg,
    borderBottomRightRadius: theme.radii.lg,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: theme.colors.border,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRightWidth: 1,
    borderColor: theme.colors.border,
  },
  actionBtnText: {
    color: theme.colors.textLight,
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
