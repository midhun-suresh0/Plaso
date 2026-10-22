import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, ActivityIndicator, Alert, Linking, Platform, Modal } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { UniversalMap, UniversalMapRef, MapMarkerItem, MapTileType } from '../components/UniversalMap';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { discoveryApi } from '../services/discoveryApi';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<any, 'MapDiscovery'>;
};

const CATEGORIES = ['All', 'Businesses', 'Marketplace', 'Posts', 'Food', 'Shopping', 'Services', 'Recommended'];
const RADII = [1, 3, 5, 10, 25];

const OSM_LAYERS: {
  id: MapTileType;
  name: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}[] = [
  {
    id: 'osm-standard',
    name: 'OpenStreetMap Standard',
    subtitle: 'Classic, highly-detailed community street map',
    icon: 'map',
    badge: 'Official',
  },
  {
    id: 'osm-dark',
    name: 'OpenStreetMap Dark',
    subtitle: 'Sleek dark theme, high contrast at night',
    icon: 'moon',
  },
  {
    id: 'osm-hot',
    name: 'Humanitarian OSM (HOT)',
    subtitle: 'High contrast with specialized public infrastructure',
    icon: 'heart',
  },
  {
    id: 'osm-topo',
    name: 'OpenTopoMap',
    subtitle: 'Topographic contour lines, hillshading & elevations',
    icon: 'earth',
  },
];

// Default fallback coordinates (Kanjirappally/Kottayam, Kerala where demo data is located)
const DEFAULT_LATITUDE = 9.528;
const DEFAULT_LONGITUDE = 76.822;

export default function MapDiscoveryScreen({ navigation }: Props) {
  const { user } = useAuth();
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [radius, setRadius] = useState(5); // Default 5km
  const [tileType, setTileType] = useState<MapTileType>('osm-standard');
  const [showLayerModal, setShowLayerModal] = useState(false);

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  const mapRef = useRef<UniversalMapRef>(null);

  const getFallbackCoords = () => {
    const userLat = user?.location?.coordinates?.[1];
    const userLng = user?.location?.coordinates?.[0];
    return {
      latitude: (typeof userLat === 'number' && !isNaN(userLat)) ? userLat : DEFAULT_LATITUDE,
      longitude: (typeof userLng === 'number' && !isNaN(userLng)) ? userLng : DEFAULT_LONGITUDE,
    };
  };

  useEffect(() => {
    let isMounted = true;

    const initLocation = async () => {
      let currentLoc: Location.LocationObject | null = null;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Fast attempt first: get last known location
          try {
            currentLoc = await Location.getLastKnownPositionAsync({});
          } catch (err) {
            // fallback to current position
          }

          if (!currentLoc) {
            try {
              currentLoc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
            } catch (err) {
              console.warn('GPS location request timed out, using fallback');
            }
          }
        }
      } catch (err) {
        console.warn('Location permission error', err);
      }

      if (!isMounted) return;

      const fallback = getFallbackCoords();
      const lat = currentLoc?.coords?.latitude ?? fallback.latitude;
      const lng = currentLoc?.coords?.longitude ?? fallback.longitude;

      const effectiveLoc: Location.LocationObject = currentLoc || {
        coords: {
          latitude: lat,
          longitude: lng,
          altitude: null,
          accuracy: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      };

      setLocation(effectiveLoc);
      await loadEntities(lat, lng, radius, activeCategory, search);

      if (isMounted) {
        setLoading(false);
      }

      // Animate map to resolved coordinates
      setTimeout(() => {
        if (mapRef.current && isMounted) {
          mapRef.current.centerOn(lat, lng, 14);
        }
      }, 500);
    };

    initLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const getCurrentCoords = () => {
    if (location?.coords?.latitude && location?.coords?.longitude) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    }
    return getFallbackCoords();
  };

  const loadEntities = async (lat: number, lng: number, rad: number, category: string, query: string) => {
    try {
      let type = 'all';
      let mappedCategory = category;
      if (category === 'Businesses') {
        type = 'businesses';
        mappedCategory = 'All';
      } else if (category === 'Marketplace') {
        type = 'marketplace';
        mappedCategory = 'All';
      } else if (category === 'Posts') {
        type = 'posts';
        mappedCategory = 'All';
      } else if (category === 'Recommended') {
        type = 'recommended';
        mappedCategory = 'All';
      }

      const res = await discoveryApi.getNearbyEntities({
        latitude: lat,
        longitude: lng,
        radius: rad,
        category: mappedCategory,
        type,
        search: query,
      });

      if (res.success && res.data) {
        setBusinesses(res.data.businesses || []);
        setListings(res.data.listings || []);
        setPosts(res.data.posts || []);
      }
    } catch (e) {
      console.error('Failed to load nearby entities', e);
    }
  };

  const centerOnUser = () => {
    const coords = getCurrentCoords();
    if (mapRef.current) {
      mapRef.current.centerOn(coords.latitude, coords.longitude, 14);
    }
  };

  const handleSearch = () => {
    const coords = getCurrentCoords();
    loadEntities(coords.latitude, coords.longitude, radius, activeCategory, search);
  };

  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat);
    const coords = getCurrentCoords();
    loadEntities(coords.latitude, coords.longitude, radius, cat, search);
  };

  const handleRadiusSelect = (rad: number) => {
    setRadius(rad);
    const coords = getCurrentCoords();
    loadEntities(coords.latitude, coords.longitude, rad, activeCategory, search);
  };

  const getDirections = (lat: number, lng: number, label: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(label)}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${encodeURIComponent(label)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });
    if (url) {
      Linking.openURL(url).catch(err => console.error('Error opening maps', err));
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loaderText}>Discovering nearby places...</Text>
      </View>
    );
  }

  const coords = getCurrentCoords();
  const initialRegion = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Filter valid coordinates to prevent native map marker crashes
  const validBusinesses = businesses.filter(
    b => b?.location?.coordinates && Array.isArray(b.location.coordinates) && b.location.coordinates.length === 2 && !isNaN(b.location.coordinates[0]) && !isNaN(b.location.coordinates[1])
  );
  const validListings = listings.filter(
    l => l?.location?.coordinates && Array.isArray(l.location.coordinates) && l.location.coordinates.length === 2 && !isNaN(l.location.coordinates[0]) && !isNaN(l.location.coordinates[1])
  );
  const validPosts = posts.filter(
    p => p?.location?.coordinates && Array.isArray(p.location.coordinates) && p.location.coordinates.length === 2 && !isNaN(p.location.coordinates[0]) && !isNaN(p.location.coordinates[1])
  );

  const mapMarkers: MapMarkerItem[] = [
    ...validBusinesses.map(b => ({
      id: b._id,
      latitude: b.location.coordinates[1],
      longitude: b.location.coordinates[0],
      title: b.name,
      subtitle: b.category || 'Business',
      category: b.category,
      isOpen: b.isOpen,
      type: 'business' as const,
      rawData: b,
    })),
    ...validListings.map(l => ({
      id: l._id,
      latitude: l.location.coordinates[1],
      longitude: l.location.coordinates[0],
      title: l.title,
      subtitle: l.category,
      price: l.price,
      category: l.category,
      type: 'listing' as const,
      rawData: l,
    })),
    ...validPosts.map(p => ({
      id: p._id,
      latitude: p.location.coordinates[1],
      longitude: p.location.coordinates[0],
      title: `${p.author?.name || 'User'}'s Post`,
      subtitle: p.content || '',
      type: 'post' as const,
      rawData: p,
    })),
  ];

  const handleMarkerPress = (marker: MapMarkerItem) => {
    if (marker.type === 'business') {
      navigation.navigate('BusinessProfile', { businessId: marker.id });
    } else if (marker.type === 'listing') {
      navigation.navigate('ListingDetails', { listingId: marker.id });
    } else if (marker.type === 'post') {
      navigation.navigate('PostDetails', { post: marker.rawData });
    }
  };

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search this area..."
            placeholderTextColor={theme.colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); handleSearch(); }}>
              <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.categories}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity 
            key={cat}
            style={[styles.chip, activeCategory === cat && styles.chipActive]}
            onPress={() => handleCategorySelect(cat)}
          >
            <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mapContainer}>
        <UniversalMap
          ref={mapRef}
          style={styles.map}
          center={coords}
          radius={radius}
          tileType={tileType}
          markers={mapMarkers}
          userLocation={coords}
          showsUserLocation={true}
          onMarkerPress={handleMarkerPress}
          onDirectionsPress={({ latitude, longitude, label }) => getDirections(latitude, longitude, label)}
        />

        {/* OpenStreetMap Floating Badge */}
        <View style={styles.osmBadge}>
          <Ionicons name="globe-outline" size={13} color="#10B981" style={{ marginRight: 5 }} />
          <Text style={styles.osmBadgeText}>OpenStreetMap</Text>
        </View>

        {/* Map Layer Switcher Button */}
        <TouchableOpacity 
          style={styles.layerButton} 
          onPress={() => setShowLayerModal(true)} 
          accessibilityLabel="Switch OpenStreetMap Layer"
        >
          <Ionicons name="layers" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.myLocationButton} onPress={centerOnUser} accessibilityLabel="Center on my location">
          <Ionicons name="navigate" size={24} color={theme.colors.primary} />
        </TouchableOpacity>

        <View style={styles.radiusControl}>
          <Text style={styles.radiusLabel}>Discovery Radius</Text>
          <View style={styles.radiusOptions}>
            {RADII.map(rad => (
              <TouchableOpacity 
                key={rad} 
                style={[styles.radiusBtn, radius === rad && styles.radiusBtnActive]}
                onPress={() => handleRadiusSelect(rad)}
              >
                <Text style={[styles.radiusBtnText, radius === rad && styles.radiusBtnTextActive]}>{rad}km</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* OpenStreetMap Layers Selector Modal */}
      <Modal
        visible={showLayerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLayerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLayerModal(false)}
        >
          <View style={styles.layerModalCard}>
            <View style={styles.layerModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="map" size={20} color={theme.colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.layerModalTitle}>OpenStreetMap Styles</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLayerModal(false)} style={styles.layerModalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.layerModalSubtitle}>
              Select an OpenStreetMap tile layer for live navigation
            </Text>

            <View style={styles.layerOptionsList}>
              {OSM_LAYERS.map(item => {
                const isSelected = tileType === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.layerOptionItem, isSelected && styles.layerOptionItemActive]}
                    onPress={() => {
                      setTileType(item.id);
                      if (mapRef.current) {
                        mapRef.current.setTileType(item.id);
                      }
                      setShowLayerModal(false);
                    }}
                  >
                    <View style={[styles.layerIconBox, isSelected && styles.layerIconBoxActive]}>
                      <Ionicons
                        name={item.icon}
                        size={20}
                        color={isSelected ? '#FFFFFF' : theme.colors.primary}
                      />
                    </View>
                    <View style={styles.layerInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.layerName, isSelected && styles.layerNameActive]}>
                          {item.name}
                        </Text>
                        {item.badge ? (
                          <View style={styles.layerBadge}>
                            <Text style={styles.layerBadgeText}>{item.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.layerDesc}>{item.subtitle}</Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                    ) : (
                      <View style={styles.layerUncheckedCircle} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.attributionFooter}>
              <Text style={styles.attributionText}>
                &copy; OpenStreetMap contributors &bull; Open Database License (ODbL)
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loaderText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    marginRight: theme.spacing.md,
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: theme.radii.full,
    paddingHorizontal: theme.spacing.md,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.sizes.sm,
  },
  categories: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  osmBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  osmBadgeText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  layerButton: {
    position: 'absolute',
    bottom: 148,
    right: 20,
    backgroundColor: theme.colors.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: theme.colors.surface,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  layerModalCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : theme.spacing.lg,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 20,
  },
  layerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  layerModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  layerModalCloseBtn: {
    padding: 4,
  },
  layerModalSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  layerOptionsList: {
    gap: 10,
  },
  layerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surfaceHighlight,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  layerOptionItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: theme.colors.primary,
  },
  layerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  layerIconBoxActive: {
    backgroundColor: theme.colors.primary,
  },
  layerInfo: {
    flex: 1,
    marginRight: 8,
  },
  layerName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  layerNameActive: {
    color: theme.colors.primary,
  },
  layerBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  layerBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  layerDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  layerUncheckedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  attributionFooter: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  attributionText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  radiusControl: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    padding: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  radiusLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  radiusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radiusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.md,
  },
  radiusBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  radiusBtnText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  radiusBtnTextActive: {
    color: '#FFFFFF',
  },
  callout: {
    minWidth: 160,
    maxWidth: 240,
    padding: 8,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  calloutCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  calloutDistance: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 6,
  },
  calloutPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 2,
  },
  calloutContent: {
    fontSize: 12,
    color: '#374151',
  },
  calloutButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 4,
  },
  calloutButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
