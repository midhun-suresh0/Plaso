import { Server as SocketIOServer, Socket } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import env from './config/env';
import logger from './utils/logger';
import User from './models/user.model';

let io: SocketIOServer;

// Store connected users: userId -> socketId[]
// A user can be connected from multiple devices
const connectedUsers = new Map<string, Set<string>>();

export const initSocket = (server: http.Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, env.jwtSecret) as { userId: string, role?: string };
      const user = await User.findById(decoded.userId).select('_id');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user id to socket
      (socket as any).userId = user._id.toString();
      next();
    } catch (err) {
      logger.error('Socket authentication error:', err);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    
    // Add to connected users
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)?.add(socket.id);
    
    // Join a room specifically for this user to receive direct events
    socket.join(userId);
    logger.info(`Socket connected: ${socket.id} for user ${userId}`);

    socket.on('joinConversation', (conversationId: string) => {
      socket.join(conversationId);
      logger.info(`User ${userId} joined conversation ${conversationId}`);
    });

    socket.on('leaveConversation', (conversationId: string) => {
      socket.leave(conversationId);
      logger.info(`User ${userId} left conversation ${conversationId}`);
    });

    socket.on('disconnect', () => {
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
      logger.info(`Socket disconnected: ${socket.id} for user ${userId}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized');
  }
  return io;
};

// Helper function to emit events to specific users
export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(userId).emit(event, data);
  }
};
