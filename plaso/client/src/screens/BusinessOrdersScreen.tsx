import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoChip } from '../components/PlasoChip';
import { PlasoButton } from '../components/PlasoButton';
import { theme } from '../constants/theme';
import { orderApi } from '../services/api/orderApi';
import { Order, OrderStatus } from '../types/order';

export default function BusinessOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  // Pass businessId when navigating here
  const { businessId } = route.params;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'NEW' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED'>('NEW');

  const fetchOrders = async () => {
    try {
      const response = await orderApi.getBusinessOrders(businessId);
      if (response.success && response.data) {
        setOrders(response.data!.orders);
      }
    } catch (error) {
      console.error('Error fetching business orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchOrders);
    return unsubscribe;
  }, [navigation, businessId]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const response = await orderApi.updateBusinessOrderStatus(orderId, status);
      if (response.success && response.data) {
        // Update locally
        setOrders(prev => prev.map(o => o._id === orderId ? response.data!.order : o));
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getFilteredOrders = () => {
    switch (filter) {
      case 'NEW':
        return orders.filter(o => [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(o.orderStatus));
      case 'PROCESSING':
        return orders.filter(o => [OrderStatus.PROCESSING, OrderStatus.READY].includes(o.orderStatus));
      case 'COMPLETED':
        return orders.filter(o => o.orderStatus === OrderStatus.COMPLETED);
      case 'CANCELLED':
        return orders.filter(o => o.orderStatus === OrderStatus.CANCELLED || o.orderStatus === OrderStatus.DISPUTED);
      default:
        return orders;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return theme.colors.success;
      case OrderStatus.CANCELLED: return theme.colors.error;
      case OrderStatus.DISPUTED: return theme.colors.error;
      case OrderStatus.READY: return theme.colors.primary;
      default: return theme.colors.textSecondary;
    }
  };

  const renderActionButtons = (item: Order) => {
    const isUpdating = updatingId === item._id;

    if (item.orderStatus === OrderStatus.PENDING) {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.outlineBtn, { borderColor: theme.colors.error, flex: 1, marginRight: 8 }]}
            onPress={() => updateOrderStatus(item._id, OrderStatus.CANCELLED)}
            disabled={isUpdating}
          >
            <Text style={[styles.outlineBtnText, { color: theme.colors.error }]}>Reject</Text>
          </TouchableOpacity>
          <PlasoButton 
            title="Accept Order" 
            onPress={() => updateOrderStatus(item._id, OrderStatus.CONFIRMED)}
            loading={isUpdating}
            style={{ flex: 1 }}
          />
        </View>
      );
    }

    if (item.orderStatus === OrderStatus.CONFIRMED) {
      return (
        <View style={styles.actionRow}>
           <PlasoButton 
            title="Start Processing" 
            onPress={() => updateOrderStatus(item._id, OrderStatus.PROCESSING)}
            loading={isUpdating}
            style={{ flex: 1 }}
          />
        </View>
      );
    }

    if (item.orderStatus === OrderStatus.PROCESSING) {
      return (
        <View style={styles.actionRow}>
           <PlasoButton 
            title="Mark as Ready" 
            onPress={() => updateOrderStatus(item._id, OrderStatus.READY)}
            loading={isUpdating}
            style={{ flex: 1 }}
          />
        </View>
      );
    }

    return null; // Ready, Completed, Cancelled don't need primary actions here usually
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const mainItem = item.items[0];

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <PlasoChip label={item.orderStatus} style={{ backgroundColor: getStatusColor(item.orderStatus), borderColor: getStatusColor(item.orderStatus) }} />
        </View>

        <TouchableOpacity 
          style={styles.itemPreview}
          onPress={() => navigation.navigate('OrderDetails' as any, { orderId: item._id })}
        >
          <View style={{flex: 1}}>
            <Text style={styles.customerName}>{item.buyer?.name || 'Customer'}</Text>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {mainItem.quantity}x {mainItem.titleSnapshot}
              {item.items.length > 1 ? ` + ${item.items.length - 1} more items` : ''}
            </Text>
            <Text style={styles.orderType}>{item.fulfillmentType.replace('_', ' ')}</Text>
          </View>
          <Text style={styles.orderTotal}>₹{item.totalAmount.toLocaleString('en-IN')}</Text>
        </TouchableOpacity>
        
        {renderActionButtons(item)}
      </View>
    );
  };

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Orders</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['NEW', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((f) => (
            <TouchableOpacity 
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f as any)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : getFilteredOrders().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={80} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>No {filter.toLowerCase()} orders right now</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredOrders()}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </PlasoScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: '#000',
  },
  listContainer: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  itemPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  customerName: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  orderType: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  outlineBtn: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontWeight: '700',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});
