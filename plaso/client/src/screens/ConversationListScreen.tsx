import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, theme } from '../constants/theme';
import { messageApi, Conversation } from '../services/api/messageApi';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socket';
import { formatDistanceToNow } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ConversationListScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();

  const fetchConversations = async () => {
    try {
      const response = await messageApi.getConversations();
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Listen for real-time conversation updates
    const handleNewMessage = (data: { conversationId: string; message: any, conversation: Conversation }) => {
      setConversations(prev => {
        const existingIdx = prev.findIndex(c => c._id === data.conversationId);
        if (existingIdx > -1) {
          const newConvs = [...prev];
          newConvs[existingIdx] = data.conversation;
          // Sort to bring updated conversation to top
          return newConvs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
        // If not found, fetch all to get correct data
        fetchConversations();
        return prev;
      });
    };

    socketService.on('newMessage', handleNewMessage);

    return () => {
      socketService.off('newMessage', handleNewMessage);
    };
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchConversations();
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    // Find the other participant
    const otherParticipant = item.participants.find(p => p._id !== user?._id);
    if (!otherParticipant) return null;

    const unreadCount = user?._id ? item.unreadCounts?.[user._id] || 0 : 0;
    
    // Display logic: if business, show business name/logo
    const displayName = item.business ? item.business.name : otherParticipant.name;
    const displayImage = item.business?.logo || otherParticipant.profileImage;
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', { conversationId: item._id })}
      >
        <View style={styles.avatarContainer}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons 
                name={item.business ? "store" : "account"} 
                size={24} 
                color={colors.textSecondary} 
              />
            </View>
          )}
          {item.business && (
            <View style={styles.businessBadge}>
              <MaterialCommunityIcons name="store" size={10} color={colors.text} />
            </View>
          )}
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            {item.lastMessageAt && (
              <Text style={[styles.time, unreadCount > 0 && styles.timeUnread]}>
                {formatDistanceToNow(new Date(item.lastMessageAt), { addSuffix: true })}
              </Text>
            )}
          </View>
          
          <View style={styles.messageRow}>
            <Text 
              style={[styles.lastMessage, unreadCount > 0 && styles.lastMessageUnread]} 
              numberOfLines={1}
            >
              {item.lastMessage || 'Start a conversation'}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 24 }} />
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="message-text-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>
            When you contact a user or a business, your conversations will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={renderConversation}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: theme.typography.sizes.xs,
    color: colors.textSecondary,
  },
  timeUnread: {
    color: colors.primary,
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: theme.typography.sizes.sm,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 16,
  },
  lastMessageUnread: {
    color: colors.text,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
