import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, TextInput, KeyboardAvoidingView, Platform, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
const ResizeMode: any = { COVER: 'cover', CONTAIN: 'contain', STRETCH: 'stretch' };
const Video: any = React.forwardRef(({ style, ...props }: any, ref: any) => (
  <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }]}>
    <Text style={{ color: 'white', textAlign: 'center', padding: 20 }}>
      Video playback requires a custom dev client.
    </Text>
  </View>
));
import { formatDistanceToNow } from 'date-fns';
import { theme, colors } from '../constants/theme';
import { RootStackParamList } from '../types';
import { storyApi } from '../services/api/storyApi';
import { useAuth } from '../context/AuthContext';
import { config } from '../constants/config';
import { PlasoAvatar } from '../components/PlasoAvatar';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds for images/text

type StoryViewerRouteProp = RouteProp<RootStackParamList, 'StoryViewer'>;

export const StoryViewerScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<StoryViewerRouteProp>();
  const { user } = useAuth();
  
  const { storyGroups, initialGroupIndex = 0 } = route.params;
  
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  
  const videoRef = useRef<any>(null);
  const progressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwner = currentStory?.author?._id === user?._id || currentStory?.author?.id === user?._id;

  // Record view on story change
  useEffect(() => {
    if (currentStory && !isOwner && !currentStory.viewed) {
      storyApi.viewStory(currentStory._id).catch(console.error);
      currentStory.viewed = true; // Optimistically mark as viewed locally
    }
    
    // Reset state for new story
    setProgress(0);
    setIsLiked(false); // Can fetch actual reaction state if API supports it per-user
    
    if (currentStory?.mediaType !== 'VIDEO') {
      startProgress();
    }

    return () => stopProgress();
  }, [currentStoryIndex, currentGroupIndex]);

  const startProgress = () => {
    stopProgress();
    if (isPaused || isReplying) return;

    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) {
          stopProgress();
          goToNextStory();
          return 1;
        }
        return prev + (50 / STORY_DURATION); // 50ms interval
      });
    }, 50);
  };

  const stopProgress = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  useEffect(() => {
    if (!isPaused && !isReplying && currentStory?.mediaType !== 'VIDEO') {
      startProgress();
    } else {
      stopProgress();
    }
  }, [isPaused, isReplying]);

  const goToNextStory = () => {
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      navigation.goBack();
    }
  };

  const goToPrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentStoryIndex(storyGroups[currentGroupIndex - 1].stories.length - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleTouchStart = (e: any) => {
    setIsPaused(true);
  };

  const handleTouchEnd = (e: any) => {
    setIsPaused(false);
    
    // Calculate if tap was on left or right side of screen
    if (!isReplying) {
      const x = e.nativeEvent.pageX;
      if (x < width / 3) {
        goToPrevStory();
      } else {
        goToNextStory();
      }
    }
  };

  const handleLike = async () => {
    if (isOwner) return;
    
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    
    try {
      await storyApi.reactToStory(currentStory._id, 'LIKE');
    } catch (error) {
      setIsLiked(!newLiked);
      console.log('Failed to like story', error);
    }
  };

  const sendReply = () => {
    if (!replyText.trim()) return;
    
    const targetUserId = currentGroup.type === 'BUSINESS' 
      ? currentGroup.business?.owner || currentGroup.business?._id // depending on API payload
      : currentGroup.author._id;
      
    // Send message to the user/business using navigation params
    navigation.navigate('Chat', {
      targetUserId: targetUserId,
      businessId: currentGroup.type === 'BUSINESS' ? currentGroup.business?._id : undefined,
      initialMessage: `Replying to your story: ${replyText}`,
    });
    
    setIsReplying(false);
    setReplyText('');
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('file:') || path.startsWith('data:')) {
      return path;
    }
    return config.api.baseUrl.replace('/api', '') + path;
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await storyApi.deleteStory(currentStory._id);
              // Optimistically close or go to next
              if (currentGroup.stories.length === 1) {
                navigation.goBack();
              } else {
                goToNextStory();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete story');
            }
          }
        }
      ]
    );
  };

  const handleShare = async () => {
    try {
      const shareMessage = `Check out this story by ${currentGroup.type === 'BUSINESS' ? currentGroup.business?.name : currentGroup.author.name} on Plaso!`;
      const url = currentStory.mediaType === 'IMAGE' || currentStory.mediaType === 'VIDEO' 
        ? getImageUrl(currentStory.mediaUrl || '') 
        : undefined;
      
      await Share.share({
        message: shareMessage,
        url: url,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (!currentGroup || !currentStory) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.white }}>Story not found</Text>
      </View>
    );
  }

  const profileImage = currentGroup.type === 'BUSINESS' 
    ? getImageUrl(currentGroup.business?.logo) 
    : getImageUrl(currentGroup.author.profileImage);
    
  const authorName = currentGroup.type === 'BUSINESS' 
    ? currentGroup.business?.name 
    : currentGroup.author.name;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.content}>
        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {currentGroup.stories.map((s: any, idx: number) => (
            <View key={s._id} style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: idx < currentStoryIndex ? '100%' : 
                           idx === currentStoryIndex ? `${progress * 100}%` : '0%' 
                  }
                ]} 
              />
            </View>
          ))}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.authorInfo}>
            <PlasoAvatar uri={profileImage} name={authorName} size="sm" />
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.timeAgo}>
              {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: false })}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            {isOwner && (
              <TouchableOpacity style={styles.headerIcon} onPress={handleDelete}>
                <Ionicons name="trash" size={24} color={colors.white} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={28} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Story Content Area (touchable for prev/next) */}
        <View 
          style={styles.mediaContainer} 
          onTouchStart={handleTouchStart} 
          onTouchEnd={handleTouchEnd}
        >
          {currentStory.mediaType === 'TEXT' ? (
            <View style={[styles.textStoryContainer, { backgroundColor: currentStory.backgroundColor || '#FF206E' }]}>
              <Text style={styles.textStoryContent}>{currentStory.text}</Text>
            </View>
          ) : currentStory.mediaType === 'IMAGE' ? (
            <Image 
              source={{ uri: getImageUrl(currentStory.mediaUrl || '') }} 
              style={styles.media} 
              resizeMode="cover"
            />
          ) : currentStory.mediaType === 'VIDEO' ? (
            <Video
              ref={videoRef}
              source={{ uri: getImageUrl(currentStory.mediaUrl || '') }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              shouldPlay={!isPaused && !isReplying}
              onPlaybackStatusUpdate={(status: any) => {
                if (status.isLoaded) {
                  setProgress(status.positionMillis / status.durationMillis);
                  if (status.didJustFinish) {
                    goToNextStory();
                  }
                }
              }}
            />
          ) : null}
        </View>

        {/* Footer (Replies & Actions) */}
        {!isOwner && (
          <View style={styles.footer}>
            <View style={styles.replyContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Reply to story..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={replyText}
                onChangeText={setReplyText}
                onFocus={() => setIsReplying(true)}
                onBlur={() => setIsReplying(false)}
                onSubmitEditing={sendReply}
                returnKeyType="send"
              />
            </View>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={32} 
                color={isLiked ? colors.primary : colors.white} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="paper-plane-outline" size={32} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
        
        {isOwner && (
          <View style={styles.ownerFooter}>
            <Ionicons name="eye-outline" size={20} color={colors.white} />
            <Text style={styles.viewCount}>{currentStory.viewCount || 0} Views</Text>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 40,
  },
  progressBarBg: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'absolute',
    top: 24, // below safe area
    left: 0,
    right: 0,
    zIndex: 10,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: theme.typography.sizes.md,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: theme.typography.sizes.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  mediaContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  textStoryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  textStoryContent: {
    fontSize: 28,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: 16,
    zIndex: 10,
  },
  replyContainer: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  replyInput: {
    color: colors.white,
    fontSize: theme.typography.sizes.md,
    height: '100%',
  },
  actionButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  ownerFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: 8,
    zIndex: 10,
  },
  viewCount: {
    color: colors.white,
    fontSize: theme.typography.sizes.md,
    fontWeight: 'bold',
  }
});
