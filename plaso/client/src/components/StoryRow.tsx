import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme, colors } from '../constants/theme';
import { RootStackParamList } from '../types';
import { StoryGroup } from '../types/story';
import { storyApi } from '../services/api/storyApi';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../utils';
import { PlasoAvatar } from './PlasoAvatar';

export const StoryRow: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    try {
      const data = await storyApi.getActiveStories();
      setStoryGroups(data);
    } catch (error) {
      console.log('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchStories();
      const interval = setInterval(fetchStories, 60000);
      return () => clearInterval(interval);
    }, [])
  );

  const handleStoryPress = (index: number) => {
    navigation.navigate('StoryViewer', { storyGroups, initialGroupIndex: index });
  };

  const hasMyStory = storyGroups.length > 0 && storyGroups[0].id === user?._id && storyGroups[0].type === 'USER';

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stories</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add Story Button / My Story */}
        <TouchableOpacity 
          style={styles.storyItem}
          onPress={() => {
            if (hasMyStory) {
              handleStoryPress(0);
            } else {
              navigation.navigate('CreateStory');
            }
          }}
        >
          <View style={[styles.avatarContainer, hasMyStory && !storyGroups[0].allViewed && styles.unseenRing]}>
            <PlasoAvatar uri={user?.profileImage} name={user?.name || ''} size="md" />
            {!hasMyStory && (
              <View style={styles.addButton}>
                <Ionicons name="add" size={16} color={colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.nameText} numberOfLines={1}>
            Your Story
          </Text>
        </TouchableOpacity>

        {/* Other Stories */}
        {storyGroups.map((group, index) => {
          // Skip my story if already rendered as the first item
          if (group.id === user?._id && group.type === 'USER') return null;

          const isBusiness = group.type === 'BUSINESS';
          const imageUrl = isBusiness ? group.business?.logo : group.author?.profileImage;
          const name = isBusiness ? group.business?.name : group.author?.name;

          return (
            <TouchableOpacity 
              key={group.id} 
              style={styles.storyItem}
              onPress={() => handleStoryPress(index)}
            >
              <View style={[styles.avatarContainer, !group.allViewed && styles.unseenRing]}>
                <PlasoAvatar 
                  uri={getImageUrl(imageUrl || '')} 
                  name={name || ''} 
                  size="md" 
                />
              </View>
              <Text style={[styles.nameText, !group.allViewed && styles.nameTextUnseen]} numberOfLines={1}>
                {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginLeft: 16,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 72,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unseenRing: {
    borderColor: colors.primary,
  },
  addButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  nameText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  nameTextUnseen: {
    color: colors.text,
    fontWeight: '600',
  }
});
