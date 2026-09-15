import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { PlasoScreen } from '../components/PlasoScreen';
import { PlasoButton } from '../components/PlasoButton';
import { PlasoInput } from '../components/PlasoInput';
import { theme } from '../constants/theme';
import { cartApi } from '../services/api/cartApi';
import { orderApi } from '../services/api/orderApi';
import { paymentApi } from '../services/api/paymentApi';
import RazorpayCheckout from 'react-native-razorpay';
import { Cart } from '../types/order';
import { ListingType } from '../types/marketplace';
import { RootStackParamList } from '../types';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CheckoutScreen() {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await cartApi.getCart();
        if (response.success && response.data) {
          if (response.data!.cart.items.length === 0) {
            navigation.goBack();
          } else {
            setCart(response.data!.cart);
          }
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [navigation]);

  const hasServices = cart?.items.some(item => item.listing.type === ListingType.SERVICE);
  const hasProducts = cart?.items.some(item => item.listing.type === ListingType.PRODUCT);

  const calculateTotal = () => {
    if (!cart) return 0;
    return cart.items.reduce((total, item) => total + (item.listing.price * item.quantity), 0);
  };

  const handlePlaceOrder = async () => {
    if (hasProducts && !address.trim()) {
      Alert.alert('Address Required', 'Please enter a delivery address for your physical products.');
      return;
    }
    if (hasServices && (!scheduledDate.trim() || !scheduledTime.trim())) {
      Alert.alert('Schedule Required', 'Please provide a preferred date and time for your service.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Plaso Order
      const orderResponse = await orderApi.createOrder({
        deliveryAddress: address,
        customerNote: note,
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
      });

      if (!orderResponse.success || !orderResponse.data || !orderResponse.data.orders || orderResponse.data.orders.length === 0) {
        throw new Error('Failed to create order');
      }

      const order = orderResponse.data.orders[0];

      // 2. Create Razorpay Payment Order
      const paymentOrderResponse = await paymentApi.createOrder(order._id);
      
      if (!paymentOrderResponse.success || !paymentOrderResponse.data) {
        throw new Error('Failed to initialize payment');
      }

      const { razorpayOrderId, amount, currency, keyId } = paymentOrderResponse.data;

      // 3. Open Razorpay Checkout
      const options = {
        description: 'Plaso Marketplace Purchase',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: currency,
        key: keyId,
        amount: amount,
        name: 'Plaso',
        order_id: razorpayOrderId,
        theme: { color: theme.colors.primary },
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        // 4. Verify Payment on Success
        try {
          const verifyResponse = await paymentApi.verifyPayment({
            orderId: order._id,
            razorpayOrderId: data.razorpay_order_id,
            razorpayPaymentId: data.razorpay_payment_id,
            signature: data.razorpay_signature,
          });

          if (verifyResponse.success) {
            Alert.alert('Payment Successful', 'Your order has been placed and paid successfully!', [
              { text: 'View Order', onPress: () => navigation.navigate('OrderDetails' as any, { orderId: order._id }) }
            ]);
          } else {
             Alert.alert('Payment Verification Failed', 'We could not verify your payment. Please contact support.', [
              { text: 'View Order', onPress: () => navigation.navigate('OrderDetails' as any, { orderId: order._id }) }
            ]);
          }
        } catch (verifyError: any) {
           Alert.alert('Verification Error', verifyError.message || 'Could not verify payment', [
              { text: 'View Order', onPress: () => navigation.navigate('OrderDetails' as any, { orderId: order._id }) }
            ]);
        } finally {
            setSubmitting(false);
        }
      }).catch((error: any) => {
        // Payment failed or cancelled
        Alert.alert('Payment Failed', 'Your payment was cancelled or failed. You can retry from your orders.', [
            { text: 'View Order', onPress: () => navigation.navigate('OrderDetails' as any, { orderId: order._id }) }
        ]);
        setSubmitting(false);
      });

    } catch (error: any) {
      Alert.alert('Checkout Failed', error.message || error.response?.data?.message || 'Something went wrong');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PlasoScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </PlasoScreen>
    );
  }

  return (
    <PlasoScreen>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cart?.items.map((item, index) => (
            <View key={index} style={styles.summaryItem}>
              <View style={styles.summaryItemDetails}>
                <Text style={styles.summaryItemTitle} numberOfLines={1}>{item.listing.title}</Text>
                <Text style={styles.summaryItemQty}>Qty: {item.quantity}</Text>
              </View>
              <Text style={styles.summaryItemPrice}>₹{(item.listing.price * item.quantity).toLocaleString('en-IN')}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Total to Pay</Text>
            <Text style={styles.summaryTotalAmount}>₹{calculateTotal().toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {hasProducts && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <PlasoInput
              placeholder="Full Delivery Address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
          </View>
        )}

        {hasServices && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Appointment Details</Text>
            <PlasoInput
              placeholder="Preferred Date (e.g. 2026-09-15)"
              value={scheduledDate}
              onChangeText={setScheduledDate}
            />
            <PlasoInput
              placeholder="Preferred Time (e.g. 10:00 AM)"
              value={scheduledTime}
              onChangeText={setScheduledTime}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Note (Optional)</Text>
          <PlasoInput
            placeholder="Any special instructions for the business?"
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={2}
            style={styles.textArea}
          />
        </View>

        <View style={styles.paymentDisclaimer}>
          <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.success} style={{marginRight: 10}}/>
          <Text style={styles.paymentDisclaimerText}>
            You will be redirected to Razorpay to complete your secure payment.
          </Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <PlasoButton 
          title="Pay Now" 
          onPress={handlePlaceOrder}
          loading={submitting}
        />
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
  section: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  paymentDisclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHighlight,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  paymentDisclaimerText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
