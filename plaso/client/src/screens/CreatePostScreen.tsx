import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { theme } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { postApi } from '../services/postApi';
import { LocationPrivacy, CreatePostRequest } from '../types/post';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoAvatar } from '../components/PlasoAvatar';
import { PlasoButton } from '../components/PlasoButton';

type Props = {
  navigation: NativeStackNavigationProp<any, 'CreatePost'>;
};

export default function CreatePostScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<LocationPrivacy>('NEARBY');
  const [location, setLocation] = useState<{ longitude: number; latitude: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setMedia(result.assets[0].uri);
    }
  };

  const handleGetLocation = async () => {
    if (location) {
      // Toggle off
      setLocation(null);
      setLocationName('');
      return;
    }

    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location helps people discover what\'s happening nearby.');
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ longitude: loc.coords.longitude, latitude: loc.coords.latitude });
      
      // Reverse geocode for a friendly name (Optional, but let's try)
      const reverse = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });

      if (reverse && reverse.length > 0) {
        setLocationName(reverse[0].city || reverse[0].district || reverse[0].region || 'Nearby');
      } else {
        setLocationName('Nearby');
      }

    } catch (error) {
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!content.trim() && !media) {
      Alert.alert('Validation Error', 'Please add some text or an image to post.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreatePostRequest = {
        visibility,
        content: content.trim() || undefined,
        media: media ? [media] : undefined,
      };

      if (location) {
        payload.location = location;
        payload.locationName = locationName;
      }

      const response = await postApi.createPost(payload);
      if (response.success) {
        navigation.navigate('Home');
      } else {
        Alert.alert('Error', response.message || 'Failed to create post');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlasoScreen>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity onPress={handlePublish} disabled={loading} style={styles.publishBtn}>
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.surface} />
            ) : (
              <Text style={styles.publishText}>Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.authorRow}>
            <PlasoAvatar uri={user?.profileImage} name={user?.name} size="md" />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{user?.name}</Text>
              <Text style={styles.authorUsername}>@{user?.username || 'user'}</Text>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="What's happening around you?"
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={content}
            onChangeText={setContent}
            maxLength={1000}
            autoFocus
          />
          <Text style={styles.charCount}>{content.length}/1000</Text>

          {media && (
            <View style={styles.mediaContainer}>
              <Image source={{ uri: media }} style={styles.mediaPreview} />
              <TouchableOpacity style={styles.removeMediaBtn} onPress={() => setMedia(null)}>
                <Ionicons name="close-circle" size={24} color={theme.colors.surface} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.toolsContainer}>
            <Text style={styles.sectionTitle}>Add to your post</Text>
            <View style={styles.toolsRow}>
              <TouchableOpacity style={styles.toolBtn} onPress={handlePickImage}>
                <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
                <Text style={styles.toolText}>Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.toolBtn, location && styles.toolBtnActive]} 
                onPress={handleGetLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <>
                    <Ionicons name="location-outline" size={24} color={location ? theme.colors.surface : theme.colors.primary} />
                    <Text style={[styles.toolText, location && styles.toolTextActive]}>
                      {locationName || 'Location'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.visibilityContainer}>
            <Text style={styles.sectionTitle}>Visibility</Text>
            <Text style={styles.visibilityHelp}>
              {visibility === 'PUBLIC' && "Visible in the public Plaso feed."}
              {visibility === 'NEARBY' && "Visible to people around your area."}
              {visibility === 'PRIVATE' && "Only visible to you."}
            </Text>
            <View style={styles.visibilityOptions}>
              {(['PUBLIC', 'NEARBY', 'PRIVATE'] as const).map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.visibilityBtn, visibility === option && styles.visibilityBtnActive]}
                  onPress={() => setVisibility(option)}
                >
                  <Text style={[styles.visibilityText, visibility === option && styles.visibilityTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerBtn: {
    padding: theme.spacing.xs,
  },
  cancelText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  publishBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
  },
  publishText: {
    color: theme.colors.surface,
    fontWeight: 'bold',
  },
  content: {
    padding: theme.spacing.lg,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  authorInfo: {
    marginLeft: theme.spacing.md,
  },
  authorName: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  },
  authorUsername: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  input: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
  },
  mediaPreview: {
    width: '100%',
    height: 300,
    borderRadius: theme.radii.md,
  },
  removeMediaBtn: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: theme.radii.full,
  },
  toolsContainer: {
    backgroundColor: theme.colors.surfaceHighlight,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  toolsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toolBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toolText: {
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  toolTextActive: {
    color: theme.colors.surface,
  },
  visibilityContainer: {
    backgroundColor: theme.colors.surfaceHighlight,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.xxl,
  },
  visibilityHelp: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    marginBottom: theme.spacing.md,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  visibilityBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
  },
  visibilityBtnActive: {
    backgroundColor: 'rgba(255, 32, 110, 0.1)',
    borderColor: theme.colors.primary,
  },
  visibilityText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  visibilityTextActive: {
    color: theme.colors.primary,
  },
});
