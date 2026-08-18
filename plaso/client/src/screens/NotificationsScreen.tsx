import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoBottomNav } from '../components/PlasoBottomNav';
import { PlasoAvatar } from '../components/PlasoAvatar';
import { theme } from '../constants/theme';
import { notificationApi, Notification } from '../services/notificationApi';
import { useNotifications } from '../context/NotificationContext';
import { useFocusEffect } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any, 'Notifications'>;
};

export default function NotificationsScreen({ navigation }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { refreshUnreadCount } = useNotifications();

  const fetchNotifications = async (pageNumber: number, isRefresh = false) => {
    try {
      const response = await notificationApi.getNotifications(pageNumber, 20);
      if (response.success && response.data) {
        if (isRefresh || pageNumber === 1) {
          setNotifications(response.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...response.data!.notifications]);
        }
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1, true);
      refreshUnreadCount(); // Refresh badge when entering screen
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && !refreshing && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read immediately in UI for responsive feel
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n => (n._id === notification._id ? { ...n, isRead: true } : n))
      );
      try {
        await notificationApi.markAsRead(notification._id);
        refreshUnreadCount();
      } catch (error) {
        console.error('Failed to mark notification read', error);
      }
    }

    // Navigate
    if (notification.type === 'LIKE' || notification.type === 'COMMENT') {
      // In a real app we'd fetch the full post or have the backend send enough details
      // Since post details screen just needs the post ID or the full post, we'll pass an object with just the ID and fetch inside PostDetails if needed,
      // But currently PostDetails expects a full post. The notification populated post might only be { _id, content }. 
      // Let's assume PostDetails can handle incomplete post by fetching, or we can just pass { _id: notification.post?._id } and adjust PostDetailsScreen if needed.
      if (notification.post) {
        navigation.navigate('PostDetails', { post: notification.post });
      }
    } else if (notification.type === 'FOLLOW') {
      navigation.navigate('UserProfile', { userId: notification.sender._id });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'LIKE': return 'liked your post';
      case 'COMMENT': return 'commented on your post';
      case 'FOLLOW': return 'started following you';
      case 'MENTION': return 'mentioned you';
      default: return 'interacted with you';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE': return <Ionicons name="heart" size={16} color={theme.colors.primary} style={styles.typeIcon} />;
      case 'COMMENT': return <Ionicons name="chatbubble" size={16} color={theme.colors.success} style={styles.typeIcon} />;
      case 'FOLLOW': return <Ionicons name="person-add" size={16} color={theme.colors.info} style={styles.typeIcon} />;
      default: return null;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <PlasoAvatar uri={item.sender.profileImage} name={item.sender.name} size="md" />
        {getNotificationIcon(item.type)}
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.notificationText}>
          <Text style={styles.boldText}>{item.sender.name}</Text> {getNotificationText(item)}
        </Text>
        <Text style={styles.timeText}>
          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptyText}>Your social activity will appear here.</Text>
    </View>
  );

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={
            hasMore && notifications.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
        />
      )}
      <PlasoBottomNav activeTab="Activity" />
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  markAllText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100, // For Bottom Nav
  },
  notificationItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  unreadItem: {
    backgroundColor: 'rgba(255, 32, 110, 0.05)', // subtle primary tint
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  typeIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: theme.colors.background,
    borderRadius: 10,
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationText: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  timeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: 'bold',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
  },
});
