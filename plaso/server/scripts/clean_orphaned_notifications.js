const mongoose = require('mongoose');

async function clean() {
  await mongoose.connect('mongodb://localhost:27017/plaso');
  const notifs = await mongoose.connection.collection('notifications').find({}).toArray();
  const users = await mongoose.connection.collection('users').find({}, { projection: { _id: 1 } }).toArray();
  const userIds = new Set(users.map(u => u._id.toString()));

  const orphaned = notifs.filter(n => !n.sender || !userIds.has(n.sender.toString()));
  if (orphaned.length > 0) {
    const ids = orphaned.map(o => o._id);
    const res = await mongoose.connection.collection('notifications').deleteMany({ _id: { $in: ids } });
    console.log(`Successfully deleted ${res.deletedCount} orphaned notifications.`);
  } else {
    console.log('No orphaned notifications found.');
  }
  await mongoose.disconnect();
}

clean().catch(console.error);
