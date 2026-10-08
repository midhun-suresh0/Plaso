const mongoose = require('mongoose');
const Cart = require('./src/models/cart.model').default;
const Business = require('./src/models/business.model').default;
const User = require('./src/models/user.model').default;
const MarketplaceListing = require('./src/models/marketplaceListing.model').default;

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/plaso');
  console.log('Connected to DB');

  const listing = await MarketplaceListing.findOne();
  console.log('Listing:', listing ? listing.title : 'None');

  if (listing) {
      const business = await Business.findById(listing.business);
      console.log('Business:', business ? business.name : 'None', 'Status:', business?.verificationStatus);
      
      const user = await User.findOne();
      console.log('User:', user ? user.name : 'None');

      try {
        const CartService = require('./src/services/cart.service').CartService;
        await CartService.addItem(user._id.toString(), listing._id.toString(), 1);
        console.log('Successfully added to cart!');
      } catch (err) {
        console.error('Error adding to cart:', err.message);
      }
  }

  process.exit(0);
}

test();
