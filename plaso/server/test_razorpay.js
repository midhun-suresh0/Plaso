const dotenv = require('dotenv');
const path = require('path');
const Razorpay = require('razorpay');

// Load from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Testing Razorpay initialization...');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID ? 'Exists' : 'Missing');
console.log('Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'Exists' : 'Missing');

try {
  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  instance.orders.create({
    amount: 100,
    currency: "INR",
    receipt: "receipt#1"
  }).then((order) => {
    console.log("Success! Created test order:", order.id);
    process.exit(0);
  }).catch((err) => {
    console.error("Error from Razorpay API:", err);
    process.exit(1);
  });
} catch (e) {
  console.error("Error initializing Razorpay:", e);
  process.exit(1);
}
