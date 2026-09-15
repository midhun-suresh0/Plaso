import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../types';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoInput } from '../components/PlasoInput';
import { PlasoButton } from '../components/PlasoButton';
import { marketplaceApi } from '../services/marketplaceApi';
import { ListingType, PriceType, AvailabilityStatus, UpdateListingPayload } from '../types/marketplace';
import { MARKETPLACE_CATEGORIES } from '../constants/marketplaceCategories';

type RouteProps = RouteProp<RootStackParamList, 'EditListing'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EditListingScreen({ navigation }: { navigation: NavigationProp }) {
  const route = useRoute<RouteProps>();
  const { listing } = route.params;

  const [loading, setLoading] = useState(false);
  
  // Form State initialized with existing listing data
  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [type, setType] = useState<ListingType>(listing.type);
  const [category, setCategory] = useState<string>(listing.category);
  const [price, setPrice] = useState(listing.price.toString());
  const [priceType, setPriceType] = useState<PriceType>(listing.priceType);
  const [availability, setAvailability] = useState<AvailabilityStatus>(listing.availabilityStatus);
  const [stock, setStock] = useState(listing.stock !== undefined ? listing.stock.toString() : '');
  const [unit, setUnit] = useState(listing.unit || '');
  const [images, setImages] = useState<string[]>(listing.images || []);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...newImages].slice(0, 5));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (!title.trim() || !description.trim() || !price.trim()) {
      Alert.alert('Validation Error', 'Title, description, and price are required.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      Alert.alert('Validation Error', 'Price must be a valid positive number.');
      return;
    }

    const numericStock = stock ? parseInt(stock) : undefined;
    if (stock && (isNaN(numericStock as number) || (numericStock as number) < 0)) {
      Alert.alert('Validation Error', 'Stock must be a valid positive number.');
      return;
    }

    try {
      setLoading(true);
      const payload: UpdateListingPayload = {
        type,
        title: title.trim(),
        description: description.trim(),
        category,
        price: numericPrice,
        priceType,
        availabilityStatus: availability,
        images,
        stock: type === ListingType.PRODUCT ? numericStock : undefined,
        unit: type === ListingType.PRODUCT ? unit.trim() : undefined,
      };

      const response = await marketplaceApi.updateListing(listing._id, payload);
      
      if (response.success) {
        Alert.alert('Success', 'Listing updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="close" size={24} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Listing</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  return (
    <PlasoScreen>
      {renderHeader()}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Images (Max 5)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {images.map((img, idx) => (
                <View key={idx} style={styles.imagePreviewContainer}>
                  <Image source={{ uri: img }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveImage(idx)}>
                    <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage}>
                  <Ionicons name="camera-outline" size={32} color={theme.colors.textSecondary} />
                  <Text style={styles.addImageText}>Add Image</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Listing Type</Text>
            <View style={styles.rowSelector}>
              <TouchableOpacity
                style={[styles.rowOption, type === ListingType.PRODUCT && styles.activeRowOption]}
                onPress={() => setType(ListingType.PRODUCT)}
              >
                <Text style={[styles.rowOptionText, type === ListingType.PRODUCT && styles.activeRowOptionText]}>Product</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rowOption, type === ListingType.SERVICE && styles.activeRowOption]}
                onPress={() => setType(ListingType.SERVICE)}
              >
                <Text style={[styles.rowOptionText, type === ListingType.SERVICE && styles.activeRowOptionText]}>Service</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {MARKETPLACE_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, category === cat.id && styles.activeCategoryChip]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={[styles.categoryChipText, category === cat.id && styles.activeCategoryChipText]}>{cat.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <PlasoInput
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Handmade Ceramic Mug"
              maxLength={100}
            />
            
            <PlasoInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your item or service..."
              multiline
              numberOfLines={4}
              maxLength={2000}
            />
          </View>

          {/* Price & Pricing Type */}
          <View style={styles.section}>
            <View style={styles.priceRow}>
              <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                <PlasoInput
                  label="Price (₹)"
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
                <Text style={styles.sectionLabel}>Price Type</Text>
                <View style={styles.dropdownPlaceholder}>
                  <Text style={{ color: theme.colors.text }}>{priceType}</Text>
                  <TouchableOpacity onPress={() => {
                    const types = Object.values(PriceType);
                    const currentIndex = types.indexOf(priceType);
                    const nextIndex = (currentIndex + 1) % types.length;
                    setPriceType(types[nextIndex]);
                  }}>
                    <Ionicons name="swap-vertical" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Product Specific Info */}
          {type === ListingType.PRODUCT && (
            <View style={styles.section}>
              <View style={styles.priceRow}>
                <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                  <PlasoInput
                    label="Stock (Optional)"
                    value={stock}
                    onChangeText={setStock}
                    placeholder="e.g., 10"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: theme.spacing.sm }}>
                  <PlasoInput
                    label="Unit (Optional)"
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="e.g., kg, piece"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Availability Status</Text>
            <View style={styles.dropdownPlaceholder}>
              <Text style={{ color: theme.colors.text }}>{availability.replace('_', ' ')}</Text>
              <TouchableOpacity onPress={() => {
                const statuses = Object.values(AvailabilityStatus);
                const currentIndex = statuses.indexOf(availability);
                const nextIndex = (currentIndex + 1) % statuses.length;
                setAvailability(statuses[nextIndex]);
              }}>
                <Ionicons name="swap-vertical" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <PlasoButton
            title={loading ? "Saving..." : "Save Changes"}
            onPress={handleUpdate}
            disabled={loading}
            style={styles.submitBtn}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  // Similar to CreateListingScreen styles
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
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
  },
  imageScroll: {
    flexDirection: 'row',
  },
  imagePreviewContainer: {
    width: 100,
    height: 100,
    marginRight: theme.spacing.md,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: theme.radii.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
  },
  addImageBtn: {
    width: 100,
    height: 100,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  addImageText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  rowSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    padding: 4,
  },
  rowOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: theme.radii.sm,
  },
  activeRowOption: {
    backgroundColor: theme.colors.primary,
  },
  rowOptionText: {
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  activeRowOptionText: {
    color: theme.colors.surface,
  },
  categoryScroll: {
    flexDirection: 'row',
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
  },
  activeCategoryChipText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dropdownPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.md,
    height: 52, // Match PlasoInput height
  },
  submitBtn: {
    marginTop: theme.spacing.lg,
  },
});
