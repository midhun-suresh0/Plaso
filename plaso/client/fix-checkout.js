const fs = require('fs');
const path = require('path');

const checkoutPath = path.join(__dirname, 'src/screens/CheckoutScreen.tsx');
let content = fs.readFileSync(checkoutPath, 'utf8');

// Add imports
if (!content.includes('paymentApi')) {
    content = content.replace("import { orderApi } from '../services/api/orderApi';", "import { orderApi } from '../services/api/orderApi';\nimport { paymentApi } from '../services/api/paymentApi';\nimport RazorpayCheckout from 'react-native-razorpay';");
}

// Replace handlePlaceOrder
const oldHandlePlaceOrder = `  const handlePlaceOrder = async () => {
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
      const response = await orderApi.createOrder({
        deliveryAddress: address,
        customerNote: note,
        scheduledDate: scheduledDate || undefined,
        scheduledTime: scheduledTime || undefined,
      });

      if (response.success) {
        Alert.alert('Success', 'Your order has been placed successfully!', [
          { text: 'View Orders', onPress: () => navigation.navigate('MyOrders' as any) }
        ]);
      }
    } catch (error: any) {
      Alert.alert('Checkout Failed', error.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };`;

const newHandlePlaceOrder = `  const handlePlaceOrder = async () => {
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

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error('Failed to create order');
      }

      const order = orderResponse.data.order;

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
  };`;

content = content.replace(oldHandlePlaceOrder, newHandlePlaceOrder);

// Replace button text from "Place Order" to "Pay Now"
content = content.replace('title="Place Order"', 'title="Pay Now"');

// Replace disclaimer
content = content.replace(
  'This is a cashless request. You will pay directly to the business upon fulfillment or when they confirm the order.',
  'You will be redirected to Razorpay to complete your secure payment.'
);

fs.writeFileSync(checkoutPath, content, 'utf8');

console.log('Fixed checkout');
