const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/plaso_dev').then(async () => {
  const db = mongoose.connection.db;
  const post = await db.collection('posts').find({}).sort({ createdAt: -1 }).limit(1).toArray();
  console.log(JSON.stringify(post, null, 2));
  mongoose.disconnect();
});
