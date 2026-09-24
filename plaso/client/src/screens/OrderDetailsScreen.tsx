import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoButton } from '../components/PlasoButton';
import { PlasoChip } from '../components/PlasoChip';
import { theme } from '../constants/theme';
import { orderApi } from '../services/api/orderApi';
import { paymentApi } from '../services/api/paymentApi';
import { reviewApi } from '../services/api/reviewApi';
import { Order, OrderStatus, FulfillmentType, PaymentStatus } from '../types/order';
import { RootStackParamList } from '../types';

type OrderDetailsRouteProp = RouteProp<RootStackParamList, 'OrderDetails' & any>; // I'll use any to bypass strict type since I haven't updated RootStackParamList yet

export default function OrderDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const { orderId, isAdminView } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      const response = await orderApi.getOrderById(orderId);
      if (response.success && response.data) {
        setOrder(response.data!.order);
        
        // Fetch review if eligible
        if (response.data!.order.orderStatus === OrderStatus.COMPLETED && !isAdminView) {
          try {
            const reviewRes = await reviewApi.getReviewByOrder(orderId);
            if (reviewRes.success && reviewRes.data) {
              setReview(reviewRes.data);
            }
          } catch (err) {
            // No review found or error
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Could not load order details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleCancel = async () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      { 
        text: 'Yes, Cancel', 
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            const response = await orderApi.cancelOrder(orderId, 'Cancelled by user from details screen');
            if (response.success && response.data) {
              setOrder(response.data!.order);
              Alert.alert('Success', 'Order cancelled');
            }
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to cancel order');
          } finally {
            setUpdating(false);
          }
        }
      }
    ]);
  };

  const handleConfirmCompletion = async () => {
    Alert.alert('Confirm Completion', 'Have you received your order/service?', [
      { text: 'No, not yet', style: 'cancel' },
      {
        text: 'Yes, Completed',
        onPress: async () => {
          setUpdating(true);
          try {
            const response = await orderApi.confirmOrderCompletion(orderId);
            if (response.success && response.data) {
              setOrder(response.data!.order);
              Alert.alert('Success', 'Order marked as completed!');
            }
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to complete order');
          } finally {
            setUpdating(false);
          }
        }
      }
    ]);
  };


  const handleRefund = async () => {
    Alert.alert('Process Refund', 'Are you sure you want to refund this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Refund',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            const response = await paymentApi.refundOrder(orderId);
            if (response.success && response.data) {
              setOrder(prev => prev ? { ...prev, paymentStatus: PaymentStatus.REFUNDED } : null);
              Alert.alert('Refund Processed', 'The amount has been refunded.');
            }
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || error.message || 'Failed to refund order');
          } finally {
            setUpdating(false);
          }
        }
      }
    ]);
  };

  const handleDispute = async () => {
    // In a real app, this would open a modal to collect dispute reason
    Alert.alert('Dispute Order', 'Are you sure you want to dispute this order? Admin will review it.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Dispute',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          try {
            const response = await orderApi.disputeOrder(orderId, 'User requested dispute');
            if (response.success && response.data) {
              setOrder(response.data!.order);
              Alert.alert('Dispute Submitted', 'Our team will review your dispute shortly.');
            }
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to dispute order');
          } finally {
            setUpdating(false);
          }
        }
      }
    ]);
  };

  if (loading || !order) {
    return (
      <PlasoScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </PlasoScreen>
    );
  }

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED: return theme.colors.success;
      case OrderStatus.CANCELLED: return theme.colors.error;
      case OrderStatus.DISPUTED: return theme.colors.error;
      case OrderStatus.READY: return theme.colors.primary;
      default: return theme.colors.textSecondary;
    }
  };

  const getPaymentColor = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PAID: return theme.colors.success;
      case PaymentStatus.FAILED: return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const canCancel = order.orderStatus === OrderStatus.PENDING || order.orderStatus === OrderStatus.CONFIRMED;
  const canComplete = order.orderStatus === OrderStatus.READY;
  const canDispute = ![OrderStatus.CANCELLED, OrderStatus.DISPUTED].includes(order.orderStatus);

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Progress Tracker Visual */}
        <View style={styles.progressSection}>
          <Text style={styles.orderNumberTitle}>Order #{order.orderNumber}</Text>
          <View style={styles.statusChips}>
             <PlasoChip 
                label={`Order: ${order.orderStatus}`} 
                style={{ backgroundColor: getStatusColor(order.orderStatus), borderColor: getStatusColor(order.orderStatus) }}
              />
              <View style={{width: 8}} />
              <PlasoChip 
                label={`Payment: ${order.paymentStatus}`} 
                style={{ borderColor: getPaymentColor(order.paymentStatus) }}
              />
          </View>
        </View>

        {/* Business Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business</Text>
          <Text style={styles.infoText}>{order.business?.name}</Text>
          {order.business?.phone && <Text style={styles.infoSubtext}>{order.business.phone}</Text>}
        </View>

        {/* Items Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.summaryItem}>
              <View style={styles.summaryItemDetails}>
                <Text style={styles.summaryItemTitle}>{item.titleSnapshot}</Text>
                <Text style={styles.summaryItemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.summaryItemPrice}>₹{item.itemTotal.toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total Amount</Text>
            <Text style={styles.summaryTotalAmount}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Fulfillment Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fulfillment Details</Text>
          <Text style={styles.infoLabel}>Type: <Text style={styles.infoText}>{order.fulfillmentType.replace('_', ' ')}</Text></Text>
          
          {order.deliveryAddress && (
            <View style={{marginTop: 8}}>
              <Text style={styles.infoLabel}>Delivery Address:</Text>
              <Text style={styles.infoText}>{order.deliveryAddress}</Text>
            </View>
          )}

          {(order.scheduledDate || order.scheduledTime) && (
            <View style={{marginTop: 8}}>
              <Text style={styles.infoLabel}>Scheduled For:</Text>
              <Text style={styles.infoText}>{order.scheduledDate} {order.scheduledTime}</Text>
            </View>
          )}

          {order.customerNote && (
            <View style={{marginTop: 8}}>
              <Text style={styles.infoLabel}>Note:</Text>
              <Text style={styles.infoText}>{order.customerNote}</Text>
            </View>
          )}
        </View>

        {/* Timestamps */}
        <View style={styles.timestampsSection}>
          <Text style={styles.timestampText}>Placed on: {new Date(order.createdAt).toLocaleString('en-IN')}</Text>
          {order.completedAt && <Text style={styles.timestampText}>Completed on: {new Date(order.completedAt).toLocaleString('en-IN')}</Text>}
          {order.cancelledAt && <Text style={styles.timestampText}>Cancelled on: {new Date(order.cancelledAt).toLocaleString('en-IN')}</Text>}
        </View>

      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        {!isAdminView && order.orderStatus === OrderStatus.COMPLETED && [PaymentStatus.PAID, PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED].includes(order.paymentStatus) && (
          <PlasoButton 
            title={review ? 'Edit Review' : 'Rate Your Experience'} 
            onPress={() => navigation.navigate('CreateReview' as any, { 
              orderId: order._id, 
              businessId: (order.business as any)?._id || order.business,
              listingId: (order.items[0]?.listing as any)?._id || order.items[0]?.listing,
              reviewId: review?._id 
            })}
            style={{ marginBottom: 12, backgroundColor: review ? theme.colors.surface : theme.colors.primary }}
            textStyle={{ color: review ? theme.colors.primary : '#000' }}
          />
        )}

        {canComplete && (
          <PlasoButton 
            title="Confirm Received" 
            onPress={handleConfirmCompletion}
            loading={updating}
            style={{ marginBottom: 12 }}
          />
        )}
        
        {canCancel && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={handleCancel}
            disabled={updating}
          >
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        )}

        {canDispute && !canCancel && !canComplete && (
           <TouchableOpacity 
           style={styles.disputeBtn} 
           onPress={handleDispute}
           disabled={updating}
         >
           <Text style={styles.disputeBtnText}>Report an Issue / Dispute</Text>
         </TouchableOpacity>
        )}

        {isAdminView && order.paymentStatus === PaymentStatus.PAID && (
          <TouchableOpacity 
            style={[styles.cancelBtn, { marginTop: 12, borderColor: theme.colors.primary }]} 
            onPress={handleRefund}
            disabled={updating}
          >
            <Text style={[styles.cancelBtnText, { color: theme.colors.primary }]}>Process Refund</Text>
          </TouchableOpacity>
        )}
      </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  orderNumberTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
  },
  statusChips: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  infoSubtext: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryItemDetails: {
    flex: 1,
    marginRight: 12,
  },
  summaryItemTitle: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 2,
  },
  summaryItemQty: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  summaryItemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 12,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  summaryTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  timestampsSection: {
    alignItems: 'center',
    marginTop: 8,
  },
  timestampText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  cancelBtn: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  cancelBtnText: {
    color: theme.colors.error,
    fontWeight: '600',
    fontSize: 16,
  },
  disputeBtn: {
    padding: 16,
    alignItems: 'center',
  },
  disputeBtnText: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
