import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { MarketplaceListing, ListingType, PriceType, AvailabilityStatus } from '../types/marketplace';
import { theme } from '../constants/theme';
import { getMarketplaceCategoryLabel, getMarketplaceCategoryIcon } from '../constants/marketplaceCategories';

interface Props {
  listing: MarketplaceListing;
  onPress: (listing: MarketplaceListing) => void;
  style?: any;
}

export const ListingCard: React.FC<Props> = ({ listing, onPress, style }) => {
  const { title, price, currency, type, priceType, images, business, distance, category, availabilityStatus } = listing;

  const displayImage = images && images.length > 0 ? images[0] : null;

  const getPriceLabel = () => {
    const formattedPrice = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(price);

    switch (priceType) {
      case PriceType.FREE:
        return 'Free';
      case PriceType.STARTING_FROM:
        return `From ${formattedPrice}`;
      case PriceType.NEGOTIABLE:
        return `${formattedPrice} (Negotiable)`;
      default:
        return formattedPrice;
    }
  };

  const getDistanceLabel = () => {
    if (distance === undefined) return null;
    const distanceKm = distance / 1000;
    if (distanceKm < 1) {
      return `${Math.round(distance)}m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => onPress(listing)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {displayImage ? (
          <Image source={{ uri: displayImage }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name={type === ListingType.PRODUCT ? 'cube-outline' : 'briefcase-outline'} size={40} color={theme.colors.textSecondary} />
          </View>
        )}
        
        {availabilityStatus !== AvailabilityStatus.AVAILABLE && (
          <View style={[styles.badge, styles.unavailableBadge]}>
            <Text style={styles.badgeText}>
              {availabilityStatus === AvailabilityStatus.OUT_OF_STOCK ? 'Out of Stock' : 'Unavailable'}
            </Text>
          </View>
        )}

        <View style={[styles.badge, styles.typeBadge]}>
          <Text style={styles.badgeText}>{type === ListingType.PRODUCT ? 'Product' : 'Service'}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>
        
        <Text style={styles.price}>{getPriceLabel()}</Text>
        
        <View style={styles.footerRow}>
          <View style={styles.categoryInfo}>
            <MaterialIcons name={getMarketplaceCategoryIcon(category) as any} size={14} color={theme.colors.textSecondary} />
            <Text style={styles.categoryText} numberOfLines={1}>{getMarketplaceCategoryLabel(category)}</Text>
          </View>
        </View>

        <View style={styles.businessRow}>
          {business?.logo ? (
            <Image source={{ uri: business.logo }} style={styles.businessLogo} />
          ) : (
            <View style={styles.businessLogoPlaceholder}>
              <MaterialIcons name="storefront" size={12} color={theme.colors.surface} />
            </View>
          )}
          <Text style={styles.businessName} numberOfLines={1}>{business?.name || 'Unknown Business'}</Text>
          
          {distance !== undefined && (
            <>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.distance}>{getDistanceLabel()}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.background,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadge: {
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  unavailableBadge: {
    top: 8,
    right: 8,
    backgroundColor: theme.colors.error,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  content: {
    padding: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  businessLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  businessLogoPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessName: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontWeight: '500',
    flexShrink: 1,
  },
  dot: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginHorizontal: 4,
  },
  distance: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
