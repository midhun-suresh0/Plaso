import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationApi } from '../services/notificationApi';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated } = useAuth();

  const refreshUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await notificationApi.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  };

  // Initial fetch and app state listener
  useEffect(() => {
    if (isAuthenticated) {
      refreshUnreadCount();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        refreshUnreadCount();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isAuthenticated]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, setUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
