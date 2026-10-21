
import Conversation from '../models/conversation.model';
import Message, { MessageType } from '../models/message.model';
import Business from '../models/business.model';
import { AppError, HttpStatus } from '../types';
import { emitToUser } from '../socket';

export class MessageService {
  /**
   * Find an existing conversation or create a new one between users/business
   */
  static async findOrCreateConversation(
    currentUserId: string,
    targetUserId?: string,
    businessId?: string,
    listingId?: string
  ) {
    let resolvedTargetUserId = targetUserId && targetUserId.trim() && targetUserId !== 'undefined' ? targetUserId.trim() : undefined;

    // If targetUserId is not directly provided but businessId is, resolve to the business owner
    if (!resolvedTargetUserId && businessId) {
      const business = await Business.findById(businessId);
      if (!business) {
        throw new AppError('Business not found', HttpStatus.NOT_FOUND);
      }
      resolvedTargetUserId = business.owner.toString();
    }

    if (!resolvedTargetUserId) {
      throw new AppError('Recipient or business is required to start a conversation', HttpStatus.BAD_REQUEST);
    }

    if (currentUserId === resolvedTargetUserId) {
      throw new AppError('You cannot message yourself or your own business', HttpStatus.BAD_REQUEST);
    }

    const participants = [currentUserId, resolvedTargetUserId].sort(); // Sort to ensure consistent array matching

    const query: any = {
      participants: { $all: participants, $size: 2 },
    };

    if (businessId) {
      query.business = businessId;
    } else {
      query.business = { $exists: false }; // User-to-User chat
    }

    let conversation = await Conversation.findOne(query)
      .populate('participants', 'name profileImage username')
      .populate('business', 'name logo');

    if (!conversation) {
      // Validate business if provided
      if (businessId) {
        const business = await Business.findById(businessId);
        if (!business) {
          throw new AppError('Business not found', HttpStatus.NOT_FOUND);
        }
        // Ensure one of the participants is the business owner
        if (business.owner.toString() !== currentUserId && business.owner.toString() !== resolvedTargetUserId) {
          throw new AppError('Invalid business conversation participants', HttpStatus.FORBIDDEN);
        }
      }

      const unreadCounts = new Map<string, number>();
      unreadCounts.set(currentUserId, 0);
      unreadCounts.set(resolvedTargetUserId, 0);

      conversation = await Conversation.create({
        participants,
        business: businessId,
        listing: listingId,
        unreadCounts,
      });

      // Populate after creation
      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name profileImage username')
        .populate('business', 'name logo');
    }

    return conversation;
  }

  /**
   * Get all conversations for a user
   */
  static async getConversations(userId: string) {
    // Find all conversations where user is a participant
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'name profileImage username')
      .populate('business', 'name logo')
      .sort({ updatedAt: -1 });

    return conversations;
  }

  /**
   * Get a specific conversation and validate membership
   */
  static async getConversation(conversationId: string, userId: string) {
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'name profileImage username')
      .populate('business', 'name logo');

    if (!conversation) {
      throw new AppError('Conversation not found', HttpStatus.NOT_FOUND);
    }

    // Verify membership
    const isParticipant = conversation.participants.some(
      (p: any) => p._id.toString() === userId
    );

    if (!isParticipant) {
      throw new AppError('Access denied', HttpStatus.FORBIDDEN);
    }

    return conversation;
  }

  /**
   * Get messages for a conversation with pagination
   */
  static async getMessages(conversationId: string, userId: string, limit = 50, skip = 0) {
    // Verify membership first
    await this.getConversation(conversationId, userId);

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name profileImage');

    return messages;
  }

  /**
   * Send a message
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: MessageType = MessageType.TEXT
  ) {
    const conversation = await this.getConversation(conversationId, senderId);

    const message = await Message.create({
      conversation: conversationId,
      sender: senderId,
      content,
      messageType,
      readBy: [senderId],
    });

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name profileImage');

    // Update conversation last message & unread count
    const targetUserId = conversation.participants.find((p: any) => p._id.toString() !== senderId)?._id.toString();

    if (targetUserId) {
      const currentCount = conversation.unreadCounts.get(targetUserId) || 0;
      conversation.unreadCounts.set(targetUserId, currentCount + 1);
    }

    conversation.lastMessage = content;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit socket event to the target user
    if (targetUserId) {
      emitToUser(targetUserId, 'newMessage', {
        conversationId,
        message: populatedMessage,
        conversation: conversation, // Send updated conv details
      });
    }

    return populatedMessage;
  }

  /**
   * Mark messages in a conversation as read
   */
  static async markAsRead(conversationId: string, userId: string) {
    const conversation = await this.getConversation(conversationId, userId);

    // Update messages
    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    // Update conversation unread count
    conversation.unreadCounts.set(userId, 0);
    await conversation.save();

    return { success: true };
  }

  /**
   * Get total unread message count for a user across all conversations
   */
  static async getUnreadCount(userId: string) {
    const conversations = await Conversation.find({ participants: userId });
    let totalUnread = 0;
    
    for (const conv of conversations) {
      totalUnread += (conv.unreadCounts.get(userId) || 0);
    }

    return totalUnread;
  }
}
