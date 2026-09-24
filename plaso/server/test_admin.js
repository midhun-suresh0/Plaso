const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/plaso').then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('users').updateOne(
    { email: 'abin37523@gmail.com' },
    { $set: { role: 'ADMIN' } }
  );
  console.log('Restored admin for abin:', result.modifiedCount);
  mongoose.disconnect();
});
