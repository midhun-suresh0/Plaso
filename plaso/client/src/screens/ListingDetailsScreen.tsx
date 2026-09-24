import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoButton } from '../components/PlasoButton';
import { marketplaceApi } from '../services/marketplaceApi';
import { cartApi } from '../services/api/cartApi';
import { reviewApi } from '../services/api/reviewApi';
import { MarketplaceListing, ListingType, PriceType, AvailabilityStatus } from '../types/marketplace';
import { Review, ReviewStats } from '../types/review';
import { getMarketplaceCategoryLabel } from '../constants/marketplaceCategories';

type RouteProps = RouteProp<RootStackParamList, 'ListingDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: screenWidth } = Dimensions.get('window');

export default function ListingDetailsScreen({ navigation }: { navigation: NavigationProp }) {
  const route = useRoute<RouteProps>();
  const { listingId } = route.params;

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    fetchListingData();
  }, [listingId]);

  const fetchListingData = async () => {
    try {
      setLoading(true);
      const [listingRes, statsRes, reviewsRes] = await Promise.all([
        marketplaceApi.getListingById(listingId),
        reviewApi.getListingRatingStats(listingId).catch(() => null),
        reviewApi.getListingReviews(listingId, 1, 3).catch(() => null)
      ]);
      
      if (listingRes.success && listingRes.data) {
        setListing(listingRes.data);
      }
      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (reviewsRes?.success && reviewsRes.data) {
        setReviews(reviewsRes.data.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch listing details', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceLabel = () => {
    if (!listing) return '';
    const formattedPrice = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: listing.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(listing.price);

    switch (listing.priceType) {
      case PriceType.FREE:
        return 'Free';
      case PriceType.STARTING_FROM:
        return `Starting from ${formattedPrice}`;
      case PriceType.NEGOTIABLE:
        return `${formattedPrice} (Negotiable)`;
      default:
        return formattedPrice;
    }
  };

  const handleAddToCart = async (goToCheckout: boolean = false) => {
    if (!listing) return;
    setAddingToCart(true);
    try {
      const res = await cartApi.addItem(listing._id, 1);
      if (res.success) {
        if (goToCheckout) {
          navigation.navigate('Cart' as any);
        } else {
          Alert.alert('Success', 'Added to cart', [
            { text: 'Keep Shopping', style: 'cancel' },
            { text: 'View Cart', onPress: () => navigation.navigate('Cart' as any) }
          ]);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <PlasoScreen>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </PlasoScreen>
    );
  }

  if (!listing) {
    return (
      <PlasoScreen>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>Listing not found or has been removed.</Text>
        </View>
      </PlasoScreen>
    );
  }

  return (
    <PlasoScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          {listing.images && listing.images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  setActiveImageIndex(Math.round(x / screenWidth));
                }}
                scrollEventThrottle={16}
              >
                {listing.images.map((img, idx) => (
                  <Image key={idx} source={{ uri: img }} style={styles.mainImage} resizeMode="cover" />
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              {listing.images.length > 1 && (
                <View style={styles.pagination}>
                  {listing.images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[styles.dot, activeImageIndex === idx && styles.activeDot]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons
                name={listing.type === ListingType.PRODUCT ? 'cube-outline' : 'briefcase-outline'}
                size={80}
                color={theme.colors.textSecondary}
              />
            </View>
          )}

          <TouchableOpacity style={styles.backButtonAbsolute} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButtonAbsolute} onPress={() => { }}>
            <Ionicons name="bookmark-outline" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Content Details */}
        <View style={styles.content}>
          <View style={styles.badgesRow}>
            <View style={[styles.badge, styles.typeBadge]}>
              <Text style={styles.badgeText}>{listing.type === ListingType.PRODUCT ? 'Product' : 'Service'}</Text>
            </View>
            <View style={[styles.badge, styles.categoryBadge]}>
              <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
                {getMarketplaceCategoryLabel(listing.category)}
              </Text>
            </View>
            {listing.availabilityStatus !== AvailabilityStatus.AVAILABLE && (
              <View style={[styles.badge, styles.unavailableBadge]}>
                <Text style={styles.badgeText}>
                  {listing.availabilityStatus === AvailabilityStatus.OUT_OF_STOCK ? 'Out of Stock' : 'Unavailable'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.titleRow}>
            <Text style={[styles.title, { flex: 1 }]}>{listing.title}</Text>
            {stats && stats.totalReviews > 0 && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{stats.averageRating.toFixed(1)}</Text>
                <Text style={styles.reviewCountText}>({stats.totalReviews})</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.price}>{getPriceLabel()}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{listing.description}</Text>

          {listing.stock !== undefined && listing.type === ListingType.PRODUCT && (
            <Text style={styles.stockText}>
              Stock: {listing.stock > 0 ? listing.stock : 'Out of stock'} {listing.unit || ''}
            </Text>
          )}

          <View style={styles.divider} />

          {/* Business Summary */}
          <Text style={styles.sectionTitle}>Offered by</Text>
          <TouchableOpacity
            style={styles.businessCard}
            onPress={() => navigation.navigate('BusinessProfile', { businessId: listing.business._id })}
            activeOpacity={0.8}
          >
            <View style={styles.businessLogoContainer}>
              {listing.business.logo ? (
                <Image source={{ uri: listing.business.logo }} style={styles.businessLogo} />
              ) : (
                <MaterialIcons name="storefront" size={24} color={theme.colors.surface} />
              )}
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{listing.business.name}</Text>
              {listing.business.address && (
                <Text style={styles.businessAddress} numberOfLines={1}>{listing.business.address}</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* Reviews Section */}
          <View style={styles.divider} />
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Reviews</Text>
          </View>
          
          {reviews.length > 0 ? (
            reviews.map((review, index) => (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.author?.name || 'User'}</Text>
                  <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.reviewRatingRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= review.rating ? 'star' : 'star-outline'}
                      size={14}
                      color="#FFD700"
                    />
                  ))}
                </View>
                {review.title && <Text style={styles.reviewTitle}>{review.title}</Text>}
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noReviewsText}>No reviews yet.</Text>
          )}
        </View>

      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footerAction}>
        {listing.availabilityStatus === AvailabilityStatus.AVAILABLE && listing.isActive ? (
          <>
            {listing.type === ListingType.PRODUCT ? (
              <>
                <PlasoButton
                  title="Add to Cart"
                  onPress={() => handleAddToCart(false)}
                  variant="secondary"
                  loading={addingToCart}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <PlasoButton
                  title="Buy Now"
                  onPress={() => handleAddToCart(true)}
                  loading={addingToCart}
                  style={{ flex: 1 }}
                />
              </>
            ) : (
              <PlasoButton
                title="Request Service"
                onPress={() => handleAddToCart(true)}
                loading={addingToCart}
                style={{ flex: 1 }}
              />
            )}
          </>
        ) : (
          <PlasoButton
            title="Currently Unavailable"
            onPress={() => { }}
            disabled
            style={{ flex: 1 }}
          />
        )}
      </View>
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: theme.spacing.md,
  },
  scrollContent: {
    paddingBottom: 100, // Space for footer action
  },
  imageGalleryContainer: {
    width: screenWidth,
    height: screenWidth * 0.8,
    backgroundColor: theme.colors.surface,
    position: 'relative',
  },
  mainImage: {
    width: screenWidth,
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  backButtonAbsolute: {
    position: 'absolute',
    top: theme.spacing.xl,
    left: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: theme.radii.full,
    padding: theme.spacing.sm,
  },
  saveButtonAbsolute: {
    position: 'absolute',
    top: theme.spacing.xl,
    right: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: theme.radii.full,
    padding: theme.spacing.sm,
  },
  pagination: {
    position: 'absolute',
    bottom: theme.spacing.md,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  content: {
    padding: theme.spacing.lg,
  },
  badgesRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.sm,
    marginRight: 8,
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: theme.colors.surfaceHighlight,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 32, 110, 0.1)',
  },
  unavailableBadge: {
    backgroundColor: theme.colors.error,
  },
  badgeText: {
    color: theme.colors.textLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textLight,
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  stockText: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  businessLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: theme.spacing.md,
  },
  businessLogo: {
    width: '100%',
    height: '100%',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  businessAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  footerAction: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 4,
    fontSize: 14,
  },
  reviewCountText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  reviewCard: {
    backgroundColor: theme.colors.surfaceHighlight,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    color: theme.colors.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  reviewDate: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reviewTitle: {
    color: theme.colors.textLight,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  reviewComment: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  noReviewsText: {
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
