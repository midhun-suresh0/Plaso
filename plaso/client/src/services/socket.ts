import { io, Socket } from 'socket.io-client';
import { config } from '../constants/config';
import { tokenStorage } from './tokenStorage';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  async connect() {
    if (this.socket?.connected) return;

    const token = await tokenStorage.getToken();
    if (!token) return;

    const baseUrl = config.api.baseUrl.replace('/api', '');

    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket'], // Use WebSocket to avoid long-polling overhead
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connect Error:', err.message);
    });

    // Re-bind all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket?.on(event, cb as any);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[Socket] Manually disconnected');
    }
  }

  joinConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('joinConversation', conversationId);
    }
  }

  leaveConversation(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leaveConversation', conversationId);
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(
        event,
        callbacks.filter((cb) => cb !== callback)
      );
    }

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }
}

export const socketService = new SocketService();
