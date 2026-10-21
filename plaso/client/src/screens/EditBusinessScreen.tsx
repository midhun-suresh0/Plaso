import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
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
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { UniversalMap } from '../components/UniversalMap';

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

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      showAlert('Error', 'Name and Description are required.');
      return;
    }

    // Location is managed by mapLocation state

    try {
      setLoading(true);
      
      const payload: any = { ...formData };
      
      // Send location directly from mapLocation state
      payload.location = {
        type: 'Point',
        coordinates: [mapLocation.longitude, mapLocation.latitude]
      };

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

        <Text style={styles.sectionTitle}>Branding (Image URLs)</Text>
        
        <PlasoInput
          label="Logo URL"
          placeholder="https://..."
          value={formData.logo}
          onChangeText={(text) => handleChange('logo', text)}
        />

        <PlasoInput
          label="Cover Image URL"
          placeholder="https://..."
          value={formData.coverImage}
          onChangeText={(text) => handleChange('coverImage', text)}
        />

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
    fontSize: 24, fontWeight: 'bold',
    color: theme.colors.textLight,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: 20, fontWeight: '600',
    color: theme.colors.textLight,
    marginBottom: theme.spacing.md,
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
    marginBottom: theme.spacing.sm,
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
  mapCenterMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -16,
    marginTop: -32,
  },
});

export default EditBusinessScreen;
