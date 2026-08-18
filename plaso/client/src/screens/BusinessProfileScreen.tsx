import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoButton } from '../components/PlasoButton';
import { theme } from '../constants/theme';
import { businessApi } from '../services/businessApi';
import { getCategoryLabel, getCategoryIcon } from '../constants/businessCategories';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

type ProfileRouteProp = RouteProp<RootStackParamList, 'BusinessProfile'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BusinessProfileScreen = () => {
  const route = useRoute<ProfileRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { businessId } = route.params;
  const { user } = useAuth();

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); // Placeholder for follow logic

  useEffect(() => {
    fetchBusiness();
  }, [businessId]);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      const data = await businessApi.getBusinessById(businessId);
      if ((data as any).success) {
        setBusiness((data as any).data);
      }
    } catch (error) {
      console.error('Error fetching business:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = () => {
    // Implement follow logic
    setIsFollowing(!isFollowing);
  };

  const handleContact = (type: 'phone' | 'email' | 'website', value: string) => {
    let url = '';
    if (type === 'phone') url = `tel:${value}`;
    if (type === 'email') url = `mailto:${value}`;
    if (type === 'website') url = value.startsWith('http') ? value : `https://${value}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      }
    });
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

  if (!business) {
    return (
      <PlasoScreen>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Business not found</Text>
        </View>
      </PlasoScreen>
    );
  }

  const isOwner = user?.id === business.owner?._id;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <PlasoScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          {business.coverImage ? (
            <Image source={{ uri: business.coverImage }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.placeholderCover]} />
          )}
          <TouchableOpacity style={styles.backButtonAbsolute} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Profile Info Header */}
        <View style={styles.profileHeader}>
          <View style={styles.logoContainer}>
            {business.logo ? (
              <Image source={{ uri: business.logo }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.placeholderLogo]}>
                <MaterialIcons name="storefront" size={40} color={theme.colors.primary} />
              </View>
            )}
          </View>
          
          <View style={styles.titleActionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.businessName}>{business.name}</Text>
              <View style={styles.categoryRow}>
                <MaterialIcons name={getCategoryIcon(business.category) as any} size={16} color={theme.colors.textSecondary} />
                <Text style={styles.categoryText}>{getCategoryLabel(business.category)}</Text>
              </View>
            </View>
            
            {isOwner ? (
              <PlasoButton 
                title="Edit Business" 
                variant="secondary" 
                 
                onPress={() => navigation.navigate('EditBusiness')} 
              />
            ) : (
              <PlasoButton 
                title={isFollowing ? 'Following' : 'Follow'} 
                variant={isFollowing ? 'secondary' : 'primary'} 
                 
                onPress={handleFollowToggle} 
              />
            )}
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusIndicator, { backgroundColor: business.isOpen ? theme.colors.success : theme.colors.error }]} />
            <Text style={[styles.statusText, { color: business.isOpen ? theme.colors.success : theme.colors.error }]}>
              {business.isOpen ? 'Open Now' : 'Closed'}
            </Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.descriptionText}>{business.description}</Text>
        </View>

        {/* Contact & Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact & Location</Text>
          
          {business.address && (
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>{business.address}</Text>
            </View>
          )}
          
          {business.phone && (
            <TouchableOpacity style={styles.infoRow} onPress={() => handleContact('phone', business.phone)}>
              <MaterialIcons name="phone" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.primary }]}>{business.phone}</Text>
            </TouchableOpacity>
          )}
          
          {business.email && (
            <TouchableOpacity style={styles.infoRow} onPress={() => handleContact('email', business.email)}>
              <MaterialIcons name="email" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.primary }]}>{business.email}</Text>
            </TouchableOpacity>
          )}
          
          {business.website && (
            <TouchableOpacity style={styles.infoRow} onPress={() => handleContact('website', business.website)}>
              <MaterialIcons name="language" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.primary }]}>{business.website}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Opening Hours */}
        {business.openingHours && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Opening Hours</Text>
            {Object.entries(business.openingHours).map(([day, hours]) => (
              <View key={day} style={styles.hoursRow}>
                <Text style={styles.dayText}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                <Text style={styles.hoursText}>{hours as string}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Posts Section (Placeholder for now) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts</Text>
          <View style={styles.emptyPostsContainer}>
            <Text style={styles.emptyText}>No posts yet.</Text>
          </View>
        </View>

      </ScrollView>
    </PlasoScreen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  backButtonAbsolute: {
    position: 'absolute',
    top: theme.spacing.xl,
    left: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: theme.radii.full,
    padding: theme.spacing.sm,
  },
  coverContainer: {
    height: 180,
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    backgroundColor: theme.colors.surface,
  },
  profileHeader: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: -40,
    marginBottom: theme.spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.background,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  placeholderLogo: {
    backgroundColor: theme.colors.surfaceHighlight,
  },
  titleActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  businessName: {
    fontSize: 24, fontWeight: 'bold',
    color: theme.colors.textLight,
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20, fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
  },
  descriptionText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dayText: {
    fontSize: 16,
    color: theme.colors.textLight,
  },
  hoursText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  emptyPostsContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  }
});

export default BusinessProfileScreen;
