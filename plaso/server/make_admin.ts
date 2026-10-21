import mongoose from 'mongoose';
import User from './src/models/user.model';
import dotenv from 'dotenv';

dotenv.config();

async function makeAdmin() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/plaso');
  
  const email = 'testuser@example.com'; // Replace with your email
  
  const user = await User.findOne({ email });
  if (user) {
    user.role = 'ADMIN' as any;
    await user.save();
    console.log(`Successfully made ${email} an ADMIN!`);
  } else {
    console.log('User not found!');
  }
  
  mongoose.disconnect();
}

makeAdmin();
