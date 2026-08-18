import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { userApi, LocationPrivacy } from '../services/userApi';
import { PLASO_INTERESTS } from '../constants/interests';
import { theme } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoInput } from '../components/PlasoInput';
import { PlasoButton } from '../components/PlasoButton';
import { PlasoAvatar } from '../components/PlasoAvatar';
import { PlasoChip } from '../components/PlasoChip';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<any, 'EditProfile'>;
};

export default function EditProfileScreen({ navigation }: Props) {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [locationPrivacy, setLocationPrivacy] = useState<keyof LocationPrivacy | undefined>(
    (user?.locationPrivacy as keyof LocationPrivacy) || 'NEARBY'
  );
  const [discoveryRadius, setDiscoveryRadius] = useState(user?.discoveryRadius?.toString() || '5');
  const [coordinates, setCoordinates] = useState(user?.location?.coordinates || null);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      if (interests.length >= 10) {
        Alert.alert('Limit Reached', 'You can select up to 10 interests.');
        return;
      }
      setInterests([...interests, interest]);
    }
  };

  const handleUpdateLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCoordinates([location.coords.longitude, location.coords.latitude]);
      Alert.alert('Success', 'Location updated locally. Save profile to apply changes.');
    } catch (error) {
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required.');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Update Location
      if (coordinates) {
        await userApi.updateLocation({ longitude: coordinates[0], latitude: coordinates[1] });
      }

      // Step 2: Update Profile
      const radiusNum = parseInt(discoveryRadius, 10);
      
      const response = await userApi.updateProfile({
        name,
        username: username || undefined,
        bio: bio || undefined,
        interests,
        locationPrivacy,
        discoveryRadius: isNaN(radiusNum) ? 5 : radiusNum,
        profileImage: profileImage || undefined, // In a real app, upload this to S3 first
      });

      if (response.success) {
        await checkAuth(); // Refresh user in context
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'An error occurred while saving.');
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} /> 
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <PlasoAvatar uri={profileImage} name={name} size="xl" />
            <TouchableOpacity style={styles.changeAvatarBtn} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={20} color={theme.colors.white} />
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <PlasoInput
              label="Name"
              placeholder="Your full name"
              value={name}
              onChangeText={setName}
              icon="person-outline"
            />
            
            <PlasoInput
              label="Username"
              placeholder="Choose a unique username"
              value={username}
              onChangeText={setUsername}
              icon="at-outline"
              autoCapitalize="none"
            />

            <PlasoInput
              label="Bio"
              placeholder="Tell us about yourself"
              value={bio}
              onChangeText={setBio}
              multiline
              style={styles.bioInput}
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Interests Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <Text style={styles.sectionSubtitle}>{interests.length}/10</Text>
            </View>
            <View style={styles.interestsContainer}>
              {PLASO_INTERESTS.map((interest: string) => (
                <PlasoChip
                  key={interest}
                  label={interest}
                  selected={interests.includes(interest)}
                  onPress={() => toggleInterest(interest)}
                  style={styles.interestChip}
                />
              ))}
            </View>
          </View>

          {/* Location & Discovery */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discovery Settings</Text>
            
            <View style={styles.locationContainer}>
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={24} color={coordinates ? theme.colors.success : theme.colors.textSecondary} />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationStatus}>
                    {coordinates ? 'Location Set' : 'Location Not Set'}
                  </Text>
                  {coordinates && (
                    <Text style={styles.locationCoords}>
                      {coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}
                    </Text>
                  )}
                </View>
              </View>
              <PlasoButton 
                title={coordinates ? "Update" : "Set Location"} 
                variant="secondary"
                onPress={handleUpdateLocation}
                loading={locationLoading}
              />
            </View>

            <Text style={styles.inputLabel}>Privacy Level</Text>
            <View style={styles.privacyRow}>
              {(['PUBLIC', 'NEARBY', 'PRIVATE'] as const).map((privacy) => (
                <TouchableOpacity
                  key={privacy}
                  style={[
                    styles.privacyOption,
                    locationPrivacy === privacy && styles.privacyOptionSelected
                  ]}
                  onPress={() => setLocationPrivacy(privacy)}
                >
                  <Text style={[
                    styles.privacyText,
                    locationPrivacy === privacy && styles.privacyTextSelected
                  ]}>
                    {privacy}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PlasoInput
              label="Discovery Radius (km)"
              placeholder="e.g. 5"
              value={discoveryRadius}
              onChangeText={setDiscoveryRadius}
              keyboardType="numeric"
              icon="compass-outline"
            />
          </View>

          <PlasoButton
            title="Save Profile"
            variant="gradient"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  changeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHighlight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.full,
    marginTop: theme.spacing.md,
  },
  changeAvatarText: {
    color: theme.colors.white,
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  section: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  sectionSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  bioInput: {
    height: 100,
    paddingTop: theme.spacing.md,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  interestChip: {
    marginBottom: theme.spacing.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHighlight,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    marginBottom: theme.spacing.lg,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationTextContainer: {
    marginLeft: theme.spacing.md,
  },
  locationStatus: {
    color: theme.colors.text,
    fontWeight: '600',
    fontSize: theme.typography.sizes.md,
  },
  locationCoords: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  privacyOption: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.background,
  },
  privacyOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(255, 32, 110, 0.1)',
  },
  privacyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
  },
  privacyTextSelected: {
    color: theme.colors.primary,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
});
