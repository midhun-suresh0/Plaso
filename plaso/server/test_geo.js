const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/plaso').then(async () => {
  const db = mongoose.connection.db;
  const indexes = await db.collection('businesses').indexes();
  console.log('Indexes:', indexes);
  
  // Try querying
  try {
    const res = await db.collection('businesses').find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [10, 10]
          },
          $maxDistance: 500000000
        }
      }
    }).toArray();
    console.log('Query result count:', res.length);
  } catch(e) {
    console.error('Query error:', e.message);
  }

  process.exit(0);
});
