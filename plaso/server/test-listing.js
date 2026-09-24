const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/plaso').then(async () => {
  const db = mongoose.connection.db;
  
  const user = await db.collection('users').findOne({ email: 'abin37523@gmail.com' });
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ userId: user._id.toString(), role: 'ADMIN' }, 'super_secret_dev_jwt_key_12345', { expiresIn: '7d' });
  
  const business = await db.collection('businesses').findOne({ owner: user._id, verificationStatus: 'APPROVED' });
  if (!business) {
    console.log('No approved business found for this user.');
    return mongoose.disconnect();
  }
  
  const payload = {
    businessId: business._id.toString(),
    type: 'PRODUCT',
    title: 'Test Listing 2',
    description: 'A test listing for marketplace',
    category: 'ELECTRONICS',
    price: 100,
    priceType: 'FIXED',
    availabilityStatus: 'AVAILABLE',
    stock: 10,
    images: []
  };

  const r = await fetch('http://localhost:5000/api/marketplace', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const res = await r.json();
  console.log('Create Listing Response:', JSON.stringify(res, null, 2));

  mongoose.disconnect();
});
