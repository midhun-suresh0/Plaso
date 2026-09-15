import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoChip } from '../components/PlasoChip';
import { theme } from '../constants/theme';
import { orderApi } from '../services/api/orderApi';
import { Order, OrderStatus } from '../types/order';
import { RootStackParamList } from '../types';

type MyOrdersNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function MyOrdersScreen() {
  const navigation = useNavigation<MyOrdersNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderApi.getMyOrders();
        if (response.success && response.data) {
          setOrders(response.data!.orders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener('focus', fetchOrders);
    return unsubscribe;
  }, [navigation]);

  const getFilteredOrders = () => {
    switch (filter) {
      case 'ACTIVE':
        return orders.filter(o => [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.READY].includes(o.orderStatus));
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

  const renderOrderItem = ({ item }: { item: Order }) => {
    const mainItem = item.items[0];
    const moreCount = item.items.length - 1;

    return (
      <TouchableOpacity 
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails' as any, { orderId: item._id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <PlasoChip label={item.orderStatus} style={{ backgroundColor: getStatusColor(item.orderStatus), borderColor: getStatusColor(item.orderStatus) }} />
        </View>

        <View style={styles.businessInfo}>
          <Ionicons name="storefront-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.businessName}>{item.business?.name || 'Business'}</Text>
        </View>

        <View style={styles.itemPreview}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {mainItem.titleSnapshot} {moreCount > 0 ? `+ ${moreCount} more` : ''}
          </Text>
          <Text style={styles.orderTotal}>₹{item.totalAmount.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </Text>
          <Text style={styles.viewDetailsText}>View Details <Ionicons name="chevron-forward" size={12} /></Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.filterContainer}>
        {['ALL', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((f) => (
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
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : getFilteredOrders().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>You haven't placed any orders yet</Text>
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
    flexDirection: 'row',
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
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  itemPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    marginRight: 12,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
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
