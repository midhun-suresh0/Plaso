const mongoose = require('mongoose');
const User = require('./src/models/user.model').default;
const Cart = require('./src/models/cart.model').default;
const { OrderService } = require('./src/services/order.service');

async function testOrder() {
  await mongoose.connect('mongodb://127.0.0.1:27017/plaso');
  const user = await User.findOne({ role: 'BUSINESS_OWNER' });
  if (!user) return console.log('No user');

  const cart = await Cart.findOne({ user: user._id });
  if (!cart || cart.items.length === 0) return console.log('No cart');

  try {
    const orders = await OrderService.createOrder(user._id.toString(), {
      deliveryAddress: 'Test Address'
    });
    console.log('Orders created:', orders);
  } catch (error) {
    console.error('Error creating order:', error);
  }
  process.exit(0);
}

testOrder();
