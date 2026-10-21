import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { colors, theme } from '../constants/theme';
import { messageApi, Conversation, Message } from '../services/api/messageApi';
import { useAuth } from '../context/AuthContext';
import { socketService } from '../services/socket';
import { format } from 'date-fns';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

export default function ChatScreen() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);

  const { conversationId: paramConversationId, targetUserId, businessId, listingId, initialMessage } = route.params;

  useEffect(() => {
    if (initialMessage) {
      setInputText(initialMessage);
    }
    initChat();
  }, []);

  const initChat = async () => {
    try {
      let convId = paramConversationId;

      if (!convId && (targetUserId || businessId)) {
        // Find or create conversation
        const response = await messageApi.findOrCreateConversation(targetUserId || '', businessId, listingId);
        if (response.success && response.data) {
          convId = response.data._id;
          setConversation(response.data);
        }
      } else if (convId) {
        const response = await messageApi.getConversation(convId);
        if (response.success && response.data) {
          setConversation(response.data);
        }
      }

      if (convId) {
        // Fetch messages
        const msgResponse = await messageApi.getMessages(convId);
        if (msgResponse.success && msgResponse.data) {
          setMessages(msgResponse.data);
        }
        
        // Mark as read
        await messageApi.markAsRead(convId);
        
        // Join socket room
        socketService.joinConversation(convId);
      }
    } catch (error: any) {
      console.error('Failed to init chat:', error);
      const errMsg = error.response?.data?.message || error.message || 'Could not start conversation.';
      if (Platform.OS === 'web') {
        window.alert(errMsg);
      } else {
        Alert.alert('Notice', errMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      if (conversation && data.conversationId === conversation._id) {
        setMessages(prev => [data.message, ...prev]);
        messageApi.markAsRead(conversation._id);
      }
    };

    socketService.on('newMessage', handleNewMessage);
    return () => {
      socketService.off('newMessage', handleNewMessage);
      if (conversation) {
        socketService.leaveConversation(conversation._id);
      }
    };
  }, [conversation]);

  const sendMessage = async () => {
    if (!inputText.trim() || !conversation) return;

    const content = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      const response = await messageApi.sendMessage(conversation._id, content);
      if (response.success && response.data) {
        setMessages(prev => [response.data!, ...prev]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could show toast or put message back in input
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message, index: number }) => {
    const isMine = item.sender._id === user?._id;
    
    // Check if we need to show date header (if message is from a different day than the previous one)
    let showDateHeader = false;
    const currentMsgDate = new Date(item.createdAt);
    
    if (index === messages.length - 1) {
      showDateHeader = true; // First message in history
    } else {
      const prevMsgDate = new Date(messages[index + 1].createdAt);
      if (currentMsgDate.toDateString() !== prevMsgDate.toDateString()) {
        showDateHeader = true;
      }
    }
    
    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeaderContainer}>
            <Text style={styles.dateHeader}>
              {format(new Date(item.createdAt), 'MMMM d, yyyy')}
            </Text>
          </View>
        )}
        <View style={[styles.messageBubbleWrapper, isMine ? styles.messageMineWrapper : styles.messageTheirsWrapper]}>
          <View style={[styles.messageBubble, isMine ? styles.messageMine : styles.messageTheirs]}>
            <Text style={[styles.messageText, isMine ? styles.messageMineText : styles.messageTheirsText]}>
              {item.content}
            </Text>
            <Text style={[styles.messageTime, isMine ? styles.messageMineTime : styles.messageTheirsTime]}>
              {format(new Date(item.createdAt), 'h:mm a')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Display info logic
  let displayName = 'Chat';
  let displayImage = '';
  
  if (conversation) {
    const otherParticipant = conversation.participants.find(p => p._id !== user?._id);
    if (conversation.business) {
      displayName = conversation.business.name;
      displayImage = conversation.business.logo || '';
    } else if (otherParticipant) {
      displayName = otherParticipant.name;
      displayImage = otherParticipant.profileImage || '';
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          {displayImage ? (
            <Image source={{ uri: displayImage }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <MaterialCommunityIcons name={conversation?.business ? "store" : "account"} size={16} color={colors.textSecondary} />
            </View>
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
        </View>
        
        <TouchableOpacity style={styles.infoButton}>
          <MaterialCommunityIcons name="information-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          inverted={true} // Messages display from bottom up
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Start the conversation</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <MaterialCommunityIcons name="plus" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Write a message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={1000}
          />
          
          {(inputText.trim().length > 0 || isSending) && (
            <TouchableOpacity 
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={isSending || !inputText.trim()}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <MaterialCommunityIcons name="send" size={20} color={colors.text} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    color: colors.text,
  },
  infoButton: {
    padding: 8,
    marginRight: -8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeader: {
    fontSize: theme.typography.sizes.xs,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageBubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageMineWrapper: {
    justifyContent: 'flex-end',
  },
  messageTheirsWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  messageMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  messageTheirs: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: theme.typography.sizes.md,
  },
  messageMineText: {
    color: colors.text,
  },
  messageTheirsText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageMineTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageTheirsTime: {
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 32,
    transform: [{ scaleY: -1 }], // Because list is inverted
  },
  emptyText: {
    fontSize: theme.typography.sizes.sm,
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    padding: 10,
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 2, // Align with single-line input
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
