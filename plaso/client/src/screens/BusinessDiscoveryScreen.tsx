import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoInput } from '../components/PlasoInput';
import { PlasoCard } from '../components/PlasoCard';
import { theme } from '../constants/theme';
import { businessDiscoveryApi } from '../services/businessDiscoveryApi';
import { BUSINESS_CATEGORIES, getCategoryIcon } from '../constants/businessCategories';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BusinessDiscoveryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const location = user?.location?.coordinates ? { longitude: user.location.coordinates[0], latitude: user.location.coordinates[1] } : null;
  const discoveryRadius = user?.discoveryRadius || 5;
  
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, [selectedCategory, location]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      if (!location) {
        // Handle no location case
        setBusinesses([]);
        return;
      }
      const data = await businessDiscoveryApi.getNearbyBusinesses(
        location.longitude,
        location.latitude,
        discoveryRadius,
        selectedCategory || undefined
      );
      if ((data as any).success) {
        setBusinesses((data as any).data);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchBusinesses();
      return;
    }
    
    try {
      setLoading(true);
      const data = await businessDiscoveryApi.searchBusinesses(searchQuery, selectedCategory || undefined);
      if ((data as any).success) {
        setBusinesses((data as any).data.businesses);
      }
    } catch (error) {
      console.error('Error searching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryItem = ({ item }: { item: typeof BUSINESS_CATEGORIES[0] }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        onPress={() => setSelectedCategory(isSelected ? null : item.id)}
      >
        <MaterialIcons 
          name={item.icon as any} 
          size={16} 
          color={isSelected ? theme.colors.textLight : theme.colors.textSecondary} 
          style={styles.categoryIcon}
        />
        <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBusinessCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('BusinessProfile', { businessId: item._id })}
    >
      <PlasoCard style={styles.businessCard}>
        <View style={styles.businessHeader}>
          {item.logo ? (
            <Image source={{ uri: item.logo }} style={styles.businessLogo} />
          ) : (
            <View style={[styles.businessLogo, styles.placeholderLogo]}>
              <MaterialIcons name="storefront" size={24} color={theme.colors.primary} />
            </View>
          )}
          <View style={styles.businessInfo}>
            <Text style={styles.businessName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.categoryRow}>
              <MaterialIcons name={getCategoryIcon(item.category) as any} size={14} color={theme.colors.textSecondary} />
              <Text style={styles.businessCategory}>{item.category}</Text>
              {item.distanceKm !== undefined && (
                <>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.businessDistance}>{item.distanceKm} km</Text>
                </>
              )}
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: item.isOpen ? theme.colors.success : theme.colors.error }]} />
              <Text style={[styles.statusText, { color: item.isOpen ? theme.colors.success : theme.colors.error }]}>
                {item.isOpen ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>
        </View>
      </PlasoCard>
    </TouchableOpacity>
  );

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.title}>Explore Local</Text>
      </View>

      <View style={styles.searchContainer}>
        <PlasoInput
          placeholder="Search businesses..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          icon="search"
          returnKeyType="search"
        />
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={BUSINESS_CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.id}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : businesses.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="storefront" size={64} color={theme.colors.surfaceHighlight} />
          <Text style={styles.emptyText}>No businesses found nearby.</Text>
        </View>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={item => item._id}
          renderItem={renderBusinessCard}
          contentContainerStyle={styles.businessList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </PlasoScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    marginRight: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: 24, fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  categoriesContainer: {
    marginBottom: theme.spacing.md,
  },
  categoriesList: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryIcon: {
    marginRight: theme.spacing.xs,
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  categoryTextSelected: {
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  businessList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  businessCard: {
    padding: theme.spacing.md,
  },
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: theme.radii.md,
    marginRight: theme.spacing.md,
  },
  placeholderLogo: {
    backgroundColor: theme.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 20, fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  dotSeparator: {
    color: theme.colors.textSecondary,
    marginHorizontal: 4,
    fontSize: 10,
  },
  businessDistance: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  }
});

export default BusinessDiscoveryScreen;
