import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
const ResizeMode: any = { COVER: 'cover', CONTAIN: 'contain', STRETCH: 'stretch' };
const Video: any = React.forwardRef(({ style, ...props }: any, ref: any) => (
  <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }]}>
    <Text style={{ color: 'white', textAlign: 'center', padding: 20 }}>
      Video preview requires a custom dev client.
    </Text>
  </View>
));
import { theme, colors } from '../constants/theme';
import { RootStackParamList } from '../types';
import { PlasoButton } from '../components/PlasoButton';
import { storyApi } from '../services/api/storyApi';
import { useAuth } from '../context/AuthContext';

type CreateStoryRouteProp = RouteProp<RootStackParamList, 'CreateStory'>;

export const CreateStoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CreateStoryRouteProp>();
  const { user } = useAuth();
  
  const authorType = route.params?.authorType || 'USER';
  const businessId = route.params?.businessId;

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO' | 'TEXT'>('IMAGE');
  const [text, setText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#FF206E');
  const [isPublishing, setIsPublishing] = useState(false);

  const bgColors = ['#FF206E', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#161922'];

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType(asset.type === 'video' ? 'VIDEO' : 'IMAGE');
      }
    } catch (error) {
      console.log('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType(asset.type === 'video' ? 'VIDEO' : 'IMAGE');
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo/video');
    }
  };

  const publishStory = async () => {
    if (mediaType === 'TEXT' && !text.trim()) {
      Alert.alert('Error', 'Please enter some text for your story');
      return;
    }
    
    if ((mediaType === 'IMAGE' || mediaType === 'VIDEO') && !mediaUri) {
      Alert.alert('Error', 'Please select media for your story');
      return;
    }

    try {
      setIsPublishing(true);
      
      await storyApi.createStory({
        authorType,
        businessId,
        mediaType,
        ...(mediaUri && { mediaUri }),
        ...(text && { text }),
        ...(mediaType === 'TEXT' && { backgroundColor }),
      });
      
      Alert.alert('Success', 'Story published successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.log('Error publishing story:', error);
      Alert.alert('Error', error.message || 'Failed to publish story');
    } finally {
      setIsPublishing(false);
    }
  };

  if (isPublishing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.publishingText}>Publishing Story...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Story</Text>
        <View style={styles.closeButton} />
      </View>

      <View style={styles.content}>
        {mediaType === 'TEXT' ? (
          <View style={[styles.textStoryContainer, { backgroundColor }]}>
            <TextInput
              style={styles.textInput}
              placeholder="Tap to type..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              multiline
              value={text}
              onChangeText={setText}
              autoFocus
              textAlign="center"
              maxLength={300}
            />
            <View style={styles.colorPicker}>
              {bgColors.map(color => (
                <TouchableOpacity 
                  key={color} 
                  style={[styles.colorCircle, { backgroundColor: color, borderWidth: backgroundColor === color ? 2 : 0, borderColor: colors.white }]}
                  onPress={() => setBackgroundColor(color)}
                />
              ))}
            </View>
          </View>
        ) : mediaUri ? (
          <View style={styles.previewContainer}>
            {mediaType === 'IMAGE' ? (
              <Image source={{ uri: mediaUri }} style={styles.preview} resizeMode="cover" />
            ) : (
              <Video
                source={{ uri: mediaUri }}
                style={styles.preview}
                useNativeControls
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
              />
            )}
            
            {/* Optional text overlay for images/video could go here */}
            
            <TouchableOpacity style={styles.removeMediaButton} onPress={() => setMediaUri(null)}>
              <Ionicons name="trash" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.selectionContainer}>
            <TouchableOpacity style={styles.selectionButton} onPress={takePhoto}>
              <View style={styles.iconCircle}>
                <Ionicons name="camera" size={32} color={colors.white} />
              </View>
              <Text style={styles.selectionText}>Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.selectionButton} onPress={pickMedia}>
              <View style={[styles.iconCircle, { backgroundColor: colors.info }]}>
                <Ionicons name="images" size={32} color={colors.white} />
              </View>
              <Text style={styles.selectionText}>Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.selectionButton} onPress={() => setMediaType('TEXT')}>
              <View style={[styles.iconCircle, { backgroundColor: colors.warning }]}>
                <Ionicons name="text" size={32} color={colors.white} />
              </View>
              <Text style={styles.selectionText}>Text</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {((mediaType !== 'TEXT' && mediaUri) || (mediaType === 'TEXT' && text.trim())) && (
          <PlasoButton 
            title={`Publish to ${authorType === 'BUSINESS' ? 'Business Story' : 'My Story'}`} 
            onPress={publishStory}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishingText: {
    fontSize: theme.typography.sizes.lg,
    color: colors.text,
    marginTop: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.lg,
    color: colors.text,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  selectionContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  selectionButton: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionText: {
    fontSize: theme.typography.sizes.md,
    color: colors.text,
    fontWeight: '600',
  },
  textStoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  textInput: {
    fontSize: 32,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  colorPicker: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
    gap: 12,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: colors.black,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
  }
});
