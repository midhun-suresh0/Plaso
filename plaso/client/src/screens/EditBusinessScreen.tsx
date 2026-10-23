import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoInput } from '../components/PlasoInput';
import { PlasoButton } from '../components/PlasoButton';
import { theme } from '../constants/theme';
import { businessApi } from '../services/businessApi';
import { BUSINESS_CATEGORIES } from '../constants/businessCategories';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { UniversalMap } from '../components/UniversalMap';
import * as ImagePicker from 'expo-image-picker';
import { getImageUrl } from '../utils';
import { appendFileToFormData } from '../utils/formDataHelper';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = NativeStackScreenProps<RootStackParamList, 'EditBusiness'>['route'];

const EditBusinessScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const businessId = route.params?.businessId;

  const { user } = useAuth();
  
  const initialLoc = user?.location?.coordinates 
    ? { longitude: user.location.coordinates[0], latitude: user.location.coordinates[1] } 
    : { longitude: 76.2673, latitude: 9.9312 }; // Kochi default

  const [mapLocation, setMapLocation] = useState(initialLoc);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: BUSINESS_CATEGORIES[0].id,
    phone: '',
    email: '',
    website: '',
    address: '',
    logo: '',
    coverImage: ''
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    if (businessId) {
      loadBusiness(businessId);
    } else {
      setInitialLoading(false);
    }
  }, [businessId]);

  const loadBusiness = async (id: string) => {
    try {
      setInitialLoading(true);
      const data: any = await businessApi.getBusinessById(id);
      if (data.success && data.data) {
        setIsEditing(true);
        setFormData({
          name: data.data.name || '',
          description: data.data.description || '',
          category: data.data.category || BUSINESS_CATEGORIES[0].id,
          phone: data.data.phone || '',
          email: data.data.email || '',
          website: data.data.website || '',
          address: data.data.address || '',
          logo: data.data.logo || '',
          coverImage: data.data.coverImage || ''
        });
        if (data.data.location?.coordinates && data.data.location.coordinates.length === 2) {
          setMapLocation({
            longitude: data.data.location.coordinates[0],
            latitude: data.data.location.coordinates[1]
          });
        }
      }
    } catch (error) {
      // No existing business or error
      console.log('No existing business found.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handlePickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Camera roll permission is required to select a business logo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFormData(prev => ({ ...prev, logo: asset.uri }));
        if (Platform.OS === 'web' && (asset as any).file) {
          setLogoFile((asset as any).file);
        } else {
          setLogoFile(null);
        }
      }
    } catch (err: any) {
      console.warn('Error picking logo:', err);
    }
  };

  const handlePickCover = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Denied', 'Camera roll permission is required to select a cover image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFormData(prev => ({ ...prev, coverImage: asset.uri }));
        if (Platform.OS === 'web' && (asset as any).file) {
          setCoverFile((asset as any).file);
        } else {
          setCoverFile(null);
        }
      }
    } catch (err: any) {
      console.warn('Error picking cover image:', err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      showAlert('Error', 'Name and Description are required.');
      return;
    }

    try {
      setLoading(true);

      const isLocalLogo = formData.logo && (
        formData.logo.startsWith('file:') ||
        formData.logo.startsWith('content:') ||
        formData.logo.startsWith('blob:') ||
        logoFile !== null
      );

      const isLocalCover = formData.coverImage && (
        formData.coverImage.startsWith('file:') ||
        formData.coverImage.startsWith('content:') ||
        formData.coverImage.startsWith('blob:') ||
        coverFile !== null
      );

      const hasFileToUpload = !!(isLocalLogo || isLocalCover);

      let payload: any;
      if (hasFileToUpload) {
        const data = new FormData();
        data.append('name', formData.name.trim());
        data.append('description', formData.description.trim());
        data.append('category', formData.category);
        if (formData.phone.trim()) data.append('phone', formData.phone.trim());
        if (formData.email.trim()) data.append('email', formData.email.trim());
        if (formData.website.trim()) data.append('website', formData.website.trim());
        if (formData.address.trim()) data.append('address', formData.address.trim());
        data.append('location', JSON.stringify({
          type: 'Point',
          coordinates: [mapLocation.longitude, mapLocation.latitude]
        }));

        if (isLocalLogo) {
          if (Platform.OS === 'web' && logoFile) {
            data.append('logo', logoFile);
          } else {
            await appendFileToFormData(data, 'logo', formData.logo);
          }
        } else if (formData.logo.trim()) {
          data.append('logo', formData.logo.trim());
        }

        if (isLocalCover) {
          if (Platform.OS === 'web' && coverFile) {
            data.append('coverImage', coverFile);
          } else {
            await appendFileToFormData(data, 'coverImage', formData.coverImage);
          }
        } else if (formData.coverImage.trim()) {
          data.append('coverImage', formData.coverImage.trim());
        }

        payload = data;
      } else {
        payload = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          category: formData.category,
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          website: formData.website.trim(),
          address: formData.address.trim(),
          logo: formData.logo.trim(),
          coverImage: formData.coverImage.trim(),
          location: {
            type: 'Point',
            coordinates: [mapLocation.longitude, mapLocation.latitude]
          }
        };
      }

      let response: any;
      if (isEditing && businessId) {
        response = await businessApi.updateMyBusiness(businessId, payload);
      } else {
        response = await businessApi.createBusiness(payload);
      }

      if (response.success) {
        showAlert('Success', `Business ${isEditing ? 'updated' : 'registered'} successfully.`);
        navigation.goBack();
      } else {
        showAlert('Error', response.message || 'Failed to save business details.');
      }
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Failed to save business details.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <PlasoScreen>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </PlasoScreen>
    );
  }

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textLight} />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Business' : 'Register Business'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        
        <PlasoInput
          label="Business Name *"
          placeholder="Enter business name"
          value={formData.name}
          onChangeText={(text) => handleChange('name', text)}
        />
        
        <PlasoInput
          label="Description *"
          placeholder="What does your business do?"
          value={formData.description}
          onChangeText={(text) => handleChange('description', text)}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Category *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {BUSINESS_CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.categoryChip, formData.category === cat.id && styles.categoryChipSelected]}
              onPress={() => handleChange('category', cat.id)}
            >
              <Text style={[styles.categoryText, formData.category === cat.id && styles.categoryTextSelected]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <PlasoInput
          label="Phone Number"
          placeholder="e.g. +1 234 567 8900"
          value={formData.phone}
          onChangeText={(text) => handleChange('phone', text)}
          keyboardType="phone-pad"
        />
        
        <PlasoInput
          label="Email Address"
          placeholder="business@example.com"
          value={formData.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <PlasoInput
          label="Website"
          placeholder="https://example.com"
          value={formData.website}
          onChangeText={(text) => handleChange('website', text)}
          keyboardType="url"
          autoCapitalize="none"
        />

        <PlasoInput
          label="Physical Address"
          placeholder="123 Main St, City"
          value={formData.address}
          onChangeText={(text) => handleChange('address', text)}
        />

        <Text style={styles.mapLabel}>Business Location on Map *</Text>
        <Text style={styles.subText}>Drag the map to pinpoint your exact business location.</Text>
        <View style={styles.mapWrapper}>
          <UniversalMap
            style={styles.map}
            center={mapLocation}
            mode="picker"
            onLocationChange={(coords) => {
              setMapLocation(coords);
            }}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Branding & Visuals</Text>
        <Text style={styles.subText}>
          Add a logo and cover image for your business. Choose a photo from your device or enter an image URL.
        </Text>

        {/* Business Logo Section */}
        <View style={styles.brandingCard}>
          <Text style={styles.brandingHeader}>Business Logo</Text>
          <View style={styles.brandingRow}>
            <View style={styles.logoPreviewContainer}>
              {formData.logo && getImageUrl(formData.logo) ? (
                <Image 
                  source={{ uri: getImageUrl(formData.logo) }} 
                  style={styles.logoPreviewImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <MaterialIcons name="storefront" size={32} color={theme.colors.textSecondary} />
                  <Text style={styles.placeholderMiniText}>No Logo</Text>
                </View>
              )}
            </View>

            <View style={styles.brandingActionCol}>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={handlePickLogo}>
                <MaterialIcons name="photo-camera" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnPrimaryText}>
                  {formData.logo ? 'Change Logo' : 'Select Logo'}
                </Text>
              </TouchableOpacity>

              {formData.logo ? (
                <TouchableOpacity 
                  style={styles.actionBtnSecondary} 
                  onPress={() => {
                    setFormData(prev => ({ ...prev, logo: '' }));
                    setLogoFile(null);
                  }}
                >
                  <MaterialIcons name="delete-outline" size={18} color={theme.colors.error || '#f87171'} style={{ marginRight: 4 }} />
                  <Text style={styles.actionBtnSecondaryText}>Remove Logo</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={{ marginTop: 12 }}>
            <PlasoInput
              label="Or Enter Logo Image URL"
              placeholder="https://example.com/logo.png"
              value={formData.logo}
              onChangeText={(text) => handleChange('logo', text)}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Cover Banner Section */}
        <View style={styles.brandingCard}>
          <Text style={styles.brandingHeader}>Cover Banner</Text>
          <View style={styles.coverPreviewContainer}>
            {formData.coverImage && getImageUrl(formData.coverImage) ? (
              <Image 
                source={{ uri: getImageUrl(formData.coverImage) }} 
                style={styles.coverPreviewImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <MaterialIcons name="image" size={36} color={theme.colors.textSecondary} />
                <Text style={styles.placeholderMiniText}>No Cover Photo Selected</Text>
              </View>
            )}
          </View>

          <View style={styles.coverActionRow}>
            <TouchableOpacity style={styles.actionBtnPrimary} onPress={handlePickCover}>
              <MaterialIcons name="add-photo-alternate" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnPrimaryText}>
                {formData.coverImage ? 'Change Cover' : 'Upload Cover Photo'}
              </Text>
            </TouchableOpacity>

            {formData.coverImage ? (
              <TouchableOpacity 
                style={styles.actionBtnSecondary} 
                onPress={() => {
                  setFormData(prev => ({ ...prev, coverImage: '' }));
                  setCoverFile(null);
                }}
              >
                <MaterialIcons name="delete-outline" size={18} color={theme.colors.error || '#f87171'} style={{ marginRight: 4 }} />
                <Text style={styles.actionBtnSecondaryText}>Remove Cover</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={{ marginTop: 12 }}>
            <PlasoInput
              label="Or Enter Cover Image URL"
              placeholder="https://example.com/cover.jpg"
              value={formData.coverImage}
              onChangeText={(text) => handleChange('coverImage', text)}
              autoCapitalize="none"
            />
          </View>
        </View>

        <PlasoButton 
          title={isEditing ? 'Save Changes' : 'Submit for Approval'}
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </PlasoScreen>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  label: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  categoryScroll: {
    marginBottom: theme.spacing.lg,
  },
  categoryChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  categoryTextSelected: {
    color: theme.colors.textLight,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
  },
  submitButton: {
    marginTop: theme.spacing.lg,
  },
  mapLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  subText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  mapWrapper: {
    height: 200,
    borderRadius: theme.radii.md,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
    position: 'relative',
  },
  map: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  brandingCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  brandingHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  logoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderMiniText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  brandingActionCol: {
    flex: 1,
    justifyContent: 'center',
  },
  coverPreviewContainer: {
    width: '100%',
    height: 140,
    borderRadius: theme.radii.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  coverPreviewImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radii.sm,
    marginRight: theme.spacing.sm,
  },
  actionBtnPrimaryText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: theme.radii.sm,
  },
  actionBtnSecondaryText: {
    color: theme.colors.error || '#f87171',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default EditBusinessScreen;

