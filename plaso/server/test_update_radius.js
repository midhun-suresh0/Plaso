const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/plaso').then(async () => {
  const db = mongoose.connection.db;
  await db.collection('users').updateMany({}, { $set: { discoveryRadius: 10000 } });
  console.log('Updated all users to 10000km discovery radius for testing');
  process.exit(0);
});
