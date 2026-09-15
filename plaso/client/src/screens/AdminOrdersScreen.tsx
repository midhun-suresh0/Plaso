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

export default function AdminOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderApi.getAdminOrders();
        if (response.success && response.data) {
          setOrders(response.data!.orders);
        }
      } catch (error) {
        console.error('Error fetching admin orders:', error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = navigation.addListener('focus', fetchOrders);
    return unsubscribe;
  }, [navigation]);

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
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <PlasoChip label={item.orderStatus} style={{ backgroundColor: getStatusColor(item.orderStatus), borderColor: getStatusColor(item.orderStatus) }} />
        </View>

        <View style={styles.itemPreview}>
          <View>
            <Text style={styles.infoLabel}>Buyer:</Text>
            <Text style={styles.infoText}>{item.buyer?.name || 'Unknown'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.infoLabel}>Business:</Text>
            <Text style={styles.infoText}>{item.business?.name || 'Unknown'}</Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </Text>
          <Text style={styles.orderTotal}>₹{item.totalAmount.toLocaleString('en-IN')}</Text>
        </View>

        <TouchableOpacity 
          style={styles.detailsBtn}
          onPress={() => navigation.navigate('OrderDetails' as any, { orderId: item._id, isAdminView: true })}
        >
          <Text style={styles.detailsBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Platform Orders</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="documents-outline" size={80} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>No orders on the platform yet</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
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
    fontWeight: '700',
    color: theme.colors.text,
  },
  itemPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  detailsBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: theme.colors.surfaceHighlight,
    borderRadius: 8,
  },
  detailsBtnText: {
    fontWeight: '600',
    color: theme.colors.text,
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
