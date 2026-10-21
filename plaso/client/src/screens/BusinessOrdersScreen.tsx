import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoChip } from '../components/PlasoChip';
import { PlasoButton } from '../components/PlasoButton';
import { theme } from '../constants/theme';
import { orderApi } from '../services/api/orderApi';
import { businessApi } from '../services/businessApi';
import { Order, OrderStatus } from '../types/order';

const PRESET_REASONS = [
  'Product out of stock',
  'Unable to fulfill',
  'Business temporarily unavailable',
  'Other',
];

export default function BusinessOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();

  const initialBusinessId = route.params?.businessId;
  const [activeBusinessId, setActiveBusinessId] = useState<string>(initialBusinessId || '');
  const [businesses, setBusinesses] = useState<any[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Rejection modal state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectOrderTarget, setRejectOrderTarget] = useState<Order | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [rejecting, setRejecting] = useState(false);

  // Load owner's businesses to support multi-business switching
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res: any = await businessApi.getMyBusinesses();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setBusinesses(res.data);
          if (!activeBusinessId) {
            setActiveBusinessId(res.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching businesses for owner:', err);
      }
    };
    fetchBusinesses();
  }, []);

  const fetchOrders = async (bizId?: string) => {
    const targetId = bizId || activeBusinessId;
    if (!targetId) return;

    try {
      setLoading(true);
      const response = await orderApi.getBusinessOrders(targetId);
      if (response.success && (response as any).orders) {
        setOrders((response as any).orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching business orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeBusinessId) {
      fetchOrders(activeBusinessId);
    }
  }, [activeBusinessId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleAcceptOrder = (order: Order) => {
    Alert.alert(
      'Accept Order',
      `Are you sure you want to accept order #${order.orderNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept Order',
          onPress: async () => {
            setUpdatingId(order._id);
            try {
              const response = await orderApi.acceptOrder(order._id);
              if (response.success && (response as any).order) {
                setOrders(prev => prev.map(o => o._id === order._id ? (response as any).order : o));
                Alert.alert('Success', `Order #${order.orderNumber} has been accepted and confirmed.`);
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to accept order.');
            } finally {
              setUpdatingId(null);
            }
          },
        },
      ]
    );
  };

  const openRejectModal = (order: Order) => {
    setRejectOrderTarget(order);
    setSelectedReason(PRESET_REASONS[0]);
    setCustomReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectOrderTarget) return;

    const finalReason = selectedReason === 'Other' ? customReason.trim() : (selectedReason || customReason).trim();
    if (!finalReason) {
      Alert.alert('Rejection Reason Required', 'Please choose or provide a reason for rejecting this order.');
      return;
    }

    setRejecting(true);
    try {
      const response = await orderApi.rejectOrder(rejectOrderTarget._id, finalReason);
      if (response.success && (response as any).order) {
        setOrders(prev => prev.map(o => o._id === rejectOrderTarget._id ? (response as any).order : o));
        setRejectModalVisible(false);
        setRejectOrderTarget(null);
        Alert.alert('Order Rejected', `Order #${rejectOrderTarget.orderNumber} has been rejected.`);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reject order.');
    } finally {
      setRejecting(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, confirmMessage?: string) => {
    const doUpdate = async () => {
      setUpdatingId(orderId);
      try {
        const response = await orderApi.updateBusinessOrderStatus(orderId, status);
        if (response.success && (response as any).order) {
          setOrders(prev => prev.map(o => o._id === orderId ? (response as any).order : o));
        }
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to update order status');
      } finally {
        setUpdatingId(null);
      }
    };

    if (confirmMessage) {
      Alert.alert('Confirm Status Change', confirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: doUpdate },
      ]);
    } else {
      doUpdate();
    }
  };

  const getFilteredOrders = () => {
    if (filter === 'ALL') return orders;
    return orders.filter(o => o.orderStatus === filter);
  };

  const pendingCount = orders.filter(o => o.orderStatus === OrderStatus.PENDING).length;

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return theme.colors.success;
      case OrderStatus.CONFIRMED: return '#3B82F6';
      case OrderStatus.PROCESSING: return '#8B5CF6';
      case OrderStatus.READY: return theme.colors.primary;
      case OrderStatus.CANCELLED: return theme.colors.error;
      case OrderStatus.DISPUTED: return theme.colors.error;
      default: return '#F59E0B';
    }
  };

  const renderActionButtons = (item: Order) => {
    const isUpdating = updatingId === item._id;

    if (item.orderStatus === OrderStatus.PENDING) {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: theme.colors.error, flex: 1, marginRight: 8 }]}
            onPress={() => openRejectModal(item)}
            disabled={isUpdating}
          >
            <Text style={[styles.outlineBtnText, { color: theme.colors.error }]}>Reject Order</Text>
          </TouchableOpacity>
          <PlasoButton
            title="Accept Order"
            onPress={() => handleAcceptOrder(item)}
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

    if (item.orderStatus === OrderStatus.READY) {
      return (
        <View style={styles.actionRow}>
          <PlasoButton
            title="Mark as Completed"
            onPress={() => updateOrderStatus(item._id, OrderStatus.COMPLETED, 'Confirm that this order has been fulfilled.')}
            loading={isUpdating}
            style={{ flex: 1 }}
          />
        </View>
      );
    }

    return null;
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const mainItem = item.items[0];
    const itemImage = (mainItem as any)?.listing?.images?.[0];

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>Order #{item.orderNumber}</Text>
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <PlasoChip
            label={item.orderStatus}
            style={{ backgroundColor: getStatusColor(item.orderStatus), borderColor: getStatusColor(item.orderStatus) }}
            selected={true}
          />
        </View>

        <TouchableOpacity
          style={styles.itemPreview}
          onPress={() => navigation.navigate('OrderDetails' as any, { orderId: item._id })}
        >
          {itemImage ? (
            <Image source={{ uri: itemImage }} style={styles.productThumb} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderThumb}>
              <Ionicons name="basket-outline" size={24} color={theme.colors.textSecondary} />
            </View>
          )}

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.customerName}>Customer: {item.buyer?.name || 'Customer'}</Text>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {mainItem?.quantity}x {mainItem?.titleSnapshot}
              {item.items.length > 1 ? ` + ${item.items.length - 1} more` : ''}
            </Text>
            <View style={styles.badgeRow}>
              <View style={[styles.methodBadge, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                <Ionicons name="bicycle-outline" size={12} color={theme.colors.textSecondary} />
                <Text style={styles.methodText}>{(item.fulfillmentType || 'PICKUP').replace('_', ' ')}</Text>
              </View>

              <View style={[styles.paymentBadge, { backgroundColor: item.paymentStatus === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                <Text style={[styles.paymentBadgeText, { color: item.paymentStatus === 'PAID' ? theme.colors.success : '#F59E0B' }]}>
                  Payment: {item.paymentStatus}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.orderTotal}>₹{item.totalAmount.toLocaleString('en-IN')}</Text>
        </TouchableOpacity>

        {renderActionButtons(item)}
      </View>
    );
  };

  const activeBusinessName = businesses.find(b => b._id === activeBusinessId)?.name || 'Business Orders';

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{activeBusinessName}</Text>
          <Text style={styles.incomingSubtext}>
            {pendingCount > 0 ? `Incoming Orders (${pendingCount})` : 'All caught up'}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Multiple Business Switcher Tabs */}
      {businesses.length > 1 && (
        <View style={styles.businessSwitcherContainer}>
          <Text style={styles.switcherLabel}>Select Business:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {businesses.map((b) => (
              <TouchableOpacity
                key={b._id}
                style={[
                  styles.bizTab,
                  activeBusinessId === b._id && styles.bizTabActive,
                ]}
                onPress={() => setActiveBusinessId(b._id)}
              >
                <Ionicons
                  name="storefront-outline"
                  size={14}
                  color={activeBusinessId === b._id ? '#000' : theme.colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.bizTabText, activeBusinessId === b._id && styles.bizTabTextActive]}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Status Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'] as const).map((f) => {
            const count = f === 'PENDING' ? pendingCount : orders.filter(o => o.orderStatus === f).length;
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filter === f && styles.filterTabActive]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  {count > 0 && f !== 'ALL' ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : getFilteredOrders().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={72} color={theme.colors.textSecondary} />
          <Text style={styles.emptyTitle}>No orders in {filter.toLowerCase()}</Text>
          <Text style={styles.emptyText}>Orders placed for this business will appear here in real-time.</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredOrders()}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}

      {/* Rejection Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Order #{rejectOrderTarget?.orderNumber}</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Please specify the reason for rejecting this order:</Text>

            {PRESET_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonOption,
                  selectedReason === reason && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Ionicons
                  name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selectedReason === reason ? theme.colors.primary : theme.colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}

            {selectedReason === 'Other' && (
              <TextInput
                style={styles.customReasonInput}
                placeholder="Enter custom rejection reason..."
                placeholderTextColor={theme.colors.textSecondary}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                maxLength={200}
              />
            )}

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRejectModalVisible(false)}
                disabled={rejecting}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <PlasoButton
                title="Confirm Rejection"
                variant="primary"
                onPress={handleConfirmReject}
                loading={rejecting}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  incomingSubtext: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  businessSwitcherContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  switcherLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  bizTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bizTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  bizTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  bizTabTextActive: {
    color: '#000',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterTextActive: {
    color: '#000',
  },
  listContainer: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceHighlight,
  },
  placeholderThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    gap: 4,
  },
  methodText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  paymentBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orderTotal: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.primary,
    marginLeft: 8,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  outlineBtn: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 14,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  reasonOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  reasonText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  customReasonInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: 12,
    color: theme.colors.text,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
