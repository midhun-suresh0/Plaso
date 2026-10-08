import api from '../api';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { StoryGroup, Story, StoryViewer } from '../../types/story';
import { config } from '../../constants/config';
import { tokenStorage } from '../tokenStorage';

export const storyApi = {
  /**
   * Get active stories for home feed
   */
  getActiveStories: async (): Promise<StoryGroup[]> => {
    const response = await api.get<StoryGroup[]>('/stories/active');
    return response.data || [];
  },

  /**
   * Create a new story
   */
  createStory: async (data: {
    authorType: 'USER' | 'BUSINESS';
    businessId?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
    mediaUri?: string;
    text?: string;
    backgroundColor?: string;
  }): Promise<Story> => {
    if (data.mediaType === 'TEXT') {
      console.log('Sending formData:', JSON.stringify(formData)); const response = await api.post<Story>('/stories', data);
      return response.data!;
    }

    if (!data.mediaUri) {
      throw new Error('Media URI is required for image/video stories');
    }

    const url = `${config.api.baseUrl}/stories`;
    const token = await tokenStorage.getToken();

    if (Platform.OS === 'web') {
      try {
        const filename = data.mediaUri.split('/').pop() || 'story.jpg';
        const formData = new FormData();
        const fetchResponse = await fetch(data.mediaUri);
        const blob = await fetchResponse.blob();
        formData.append('storyMedia', blob, filename);
        
        formData.append('authorType', String(data.authorType));
        if (data.businessId) formData.append('businessId', String(data.businessId));
        formData.append('mediaType', String(data.mediaType));
        if (data.text) formData.append('text', String(data.text));
        if (data.backgroundColor) formData.append('backgroundColor', String(data.backgroundColor));
        
        const options: RequestInit = {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
          },
          body: formData,
        };

        const uploadResponse = await fetch(url, options);
        const responseData = await uploadResponse.json();

        if (!uploadResponse.ok || !responseData.success) {
          throw new Error(responseData.message || 'Unknown error during upload');
        }

        return responseData.data;
      } catch (e: any) {
        throw new Error(`Failed to process image on Web: ${e.message}`);
      }
    } else {
      // Native FileSystem bypasses React Native's buggy FormData implementation entirely
      const parameters: Record<string, string> = {
        authorType: String(data.authorType),
        mediaType: String(data.mediaType),
      };
      
      if (data.businessId) parameters.businessId = String(data.businessId);
      if (data.text) parameters.text = String(data.text);
      if (data.backgroundColor) parameters.backgroundColor = String(data.backgroundColor);

      try {
        const response = await FileSystem.uploadAsync(url, data.mediaUri, {
          httpMethod: 'POST',
          // FileSystem.FileSystemUploadType.MULTIPART is 1
          uploadType: FileSystem.FileSystemUploadType ? FileSystem.FileSystemUploadType.MULTIPART : 1,
          fieldName: 'storyMedia',
          parameters,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const responseData = JSON.parse(response.body);
        if (response.status !== 200 && response.status !== 201 || !responseData.success) {
          throw new Error(responseData.message || 'Unknown error during upload');
        }
        return responseData.data;
      } catch (error: any) {
        throw new Error(`Failed to upload story: ${error.message}`);
      }
    }
  },

  /**
   * Mark story as viewed
   */
  viewStory: async (storyId: string): Promise<boolean> => {
    const response = await api.post<{viewed: boolean}>(`/stories/${storyId}/view`, {});
    return response.data?.viewed || true;
  },

  /**
   * React to story
   */
  reactToStory: async (storyId: string, type = 'LIKE'): Promise<boolean> => {
    const response = await api.post<{reacted: boolean}>(`/stories/${storyId}/react`, { type });
    return response.data?.reacted || true;
  },

  /**
   * Get viewers for author's story
   */
  getStoryViewers: async (storyId: string): Promise<StoryViewer[]> => {
    const response = await api.get<StoryViewer[]>(`/stories/${storyId}/viewers`);
    return response.data || [];
  },

  /**
   * Delete story
   */
  deleteStory: async (storyId: string): Promise<void> => {
    await api.delete(`/stories/${storyId}`);
  },
};
