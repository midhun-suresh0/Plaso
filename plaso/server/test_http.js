const mongoose = require('mongoose');
const User = require('./src/models/user.model').default;
const MarketplaceListing = require('./src/models/marketplaceListing.model').default;
const { AuthService } = require('./src/services/auth.service');

async function testHttp() {
  await mongoose.connect('mongodb://127.0.0.1:27017/plaso');
  const user = await User.findOne({ role: 'BUSINESS_OWNER' });
  const listing = await MarketplaceListing.findOne();
  
  if (!user || !listing) {
    console.log('Missing data');
    process.exit(1);
  }

  const token = AuthService.generateToken(user);
  
  const res = await fetch('http://127.0.0.1:5000/api/cart/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ listingId: listing._id.toString(), quantity: 1 })
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
  process.exit(0);
}

testHttp();
