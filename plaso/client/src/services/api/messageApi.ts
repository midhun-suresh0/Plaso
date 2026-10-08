import api from '../api';

export interface Participant {
  _id: string;
  name: string;
  username?: string;
  profileImage?: string;
}

export interface ConversationBusiness {
  _id: string;
  name: string;
  logo?: string;
}

export interface Conversation {
  _id: string;
  participants: Participant[];
  business?: ConversationBusiness;
  listing?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCounts: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: Participant;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'LISTING' | 'POST';
  readBy: string[];
  createdAt: string;
}

class MessageApi {
  /** Get all conversations for current user */
  async getConversations() {
    return api.get<Conversation[]>('/conversations');
  }

  /** Find or create conversation */
  async findOrCreateConversation(targetUserId: string, businessId?: string, listingId?: string) {
    return api.post<Conversation>('/conversations', {
      targetUserId,
      businessId,
      listingId,
    });
  }

  /** Get specific conversation */
  async getConversation(id: string) {
    return api.get<Conversation>(`/conversations/${id}`);
  }

  /** Get messages in conversation */
  async getMessages(conversationId: string, limit: number = 50, skip: number = 0) {
    return api.get<Message[]>(`/conversations/${conversationId}/messages?limit=${limit}&skip=${skip}`);
  }

  /** Send message */
  async sendMessage(conversationId: string, content: string, messageType: string = 'TEXT') {
    return api.post<Message>(`/conversations/${conversationId}/messages`, {
      content,
      messageType,
    });
  }

  /** Mark conversation as read */
  async markAsRead(conversationId: string) {
    return api.patch<{ success: boolean }>(`/conversations/${conversationId}/read`, {});
  }

  /** Get unread message count */
  async getUnreadCount() {
    return api.get<number>('/conversations/unread-count');
  }
}

export const messageApi = new MessageApi();
