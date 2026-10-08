const mongoose = require('mongoose');
const Cart = require('./src/models/cart.model').default;

async function checkCarts() {
  await mongoose.connect('mongodb://127.0.0.1:27017/plaso');
  const carts = await Cart.find();
  console.log('Total carts:', carts.length);
  for (const c of carts) {
    console.log(`Cart for user ${c.user}, items: ${c.items.length}`);
  }
  process.exit(0);
}

checkCarts();
