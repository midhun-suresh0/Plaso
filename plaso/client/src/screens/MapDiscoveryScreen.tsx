import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import MapView, { Marker, Callout } from '../components/MapProxy';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { PlasoScreen } from '../components/PlasoScreen';
import { discoveryApi } from '../services/discoveryApi';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<any, 'MapDiscovery'>;
};

const CATEGORIES = ['All', 'Businesses', 'Marketplace', 'Posts', 'Food', 'Shopping', 'Services', 'Recommended'];
const RADII = [1, 3, 5, 10, 25];

export default function MapDiscoveryScreen({ navigation }: Props) {
  const { user } = useAuth();
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [radius, setRadius] = useState(5); // Default 5km

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed to show nearby places.');
        setLoading(false);
        return;
      }

      let currentLoc = await Location.getCurrentPositionAsync({});
      setLocation(currentLoc);
      
      // Load nearby entities
      loadEntities(currentLoc.coords.latitude, currentLoc.coords.longitude, radius, activeCategory, search);
      setLoading(false);
    })();
  }, []);

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
        search: query
      });

      if (res.success && res.data) {
        setBusinesses(res.data.businesses || []);
        setListings(res.data.listings || []);
        setPosts(res.data.posts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const handleSearch = () => {
    if (location) {
      loadEntities(location.coords.latitude, location.coords.longitude, radius, activeCategory, search);
    }
  };

  const handleCategorySelect = (cat: string) => {
    setActiveCategory(cat);
    if (location) {
      loadEntities(location.coords.latitude, location.coords.longitude, radius, cat, search);
    }
  };

  const handleRadiusSelect = (rad: number) => {
    setRadius(rad);
    if (location) {
      loadEntities(location.coords.latitude, location.coords.longitude, rad, activeCategory, search);
    }
  };

  const getDirections = (lat: number, lng: number, label: string) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    });
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const initialRegion = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : {
    latitude: 9.9312,
    longitude: 76.2673, // Default fallback (Kochi)
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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
          />
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
        <MapView 
          ref={mapRef}
          style={styles.map} 
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          userInterfaceStyle="dark"
        >
          {businesses.map(b => (
            <Marker
              key={`bus-${b._id}`}
              coordinate={{ latitude: b.location.coordinates[1], longitude: b.location.coordinates[0] }}
              pinColor={theme.colors.primary}
            >
              <Callout onPress={() => navigation.navigate('BusinessProfile', { businessId: b._id })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{b.name}</Text>
                  <Text style={styles.calloutCategory}>{b.category}</Text>
                  <Text style={styles.calloutDistance}>{b.isOpen ? 'Open' : 'Closed'}</Text>
                  <TouchableOpacity style={styles.calloutButton} onPress={() => getDirections(b.location.coordinates[1], b.location.coordinates[0], b.name)}>
                    <Text style={styles.calloutButtonText}>Directions</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          ))}

          {listings.map(l => (
            <Marker
              key={`list-${l._id}`}
              coordinate={{ latitude: l.location.coordinates[1], longitude: l.location.coordinates[0] }}
              pinColor={theme.colors.success}
            >
              <Callout onPress={() => navigation.navigate('ListingDetails', { listingId: l._id })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{l.title}</Text>
                  <Text style={styles.calloutPrice}>₹{l.price}</Text>
                  <Text style={styles.calloutCategory}>{l.category}</Text>
                </View>
              </Callout>
            </Marker>
          ))}

          {posts.map(p => (
            <Marker
              key={`post-${p._id}`}
              coordinate={{ latitude: p.location.coordinates[1], longitude: p.location.coordinates[0] }}
              pinColor={theme.colors.textSecondary}
            >
              <Callout onPress={() => navigation.navigate('PostDetails', { post: p })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutTitle}>{p.author?.name}'s Post</Text>
                  <Text style={styles.calloutContent} numberOfLines={2}>{p.content}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
        
        <TouchableOpacity style={styles.myLocationButton} onPress={centerOnUser}>
          <Ionicons name="navigate" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.radiusControl}>
          <Text style={styles.radiusLabel}>Radius</Text>
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
  },
  categories: {
    flexDirection: 'row',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    color: theme.colors.surface,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 100,
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
    elevation: 5,
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
    elevation: 5,
  },
  radiusLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
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
    color: theme.colors.surface,
  },
  callout: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  calloutCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calloutPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 4,
  },
  calloutDistance: {
    fontSize: 12,
    color: '#333',
    marginBottom: 8,
  },
  calloutContent: {
    fontSize: 12,
    color: '#333',
  },
  calloutButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  calloutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
