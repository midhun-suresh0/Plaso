const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/plaso_dev').then(async () => {
  const db = mongoose.connection.db;
  const result = await db.collection('users').updateMany(
    { email: { $regex: 'admin', $options: 'i' } },
    { $set: { role: 'ADMIN' } }
  );
  console.log('Restored admin roles:', result.modifiedCount);
  mongoose.disconnect();
});
