import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { postService } from './src/services/post.service';
import User from './src/models/user.model';
import Post from './src/models/post.model';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/plaso');
  console.log('Connected to DB');

  try {
    // 1. Find a user (create one if doesn't exist for test)
    let user = await User.findOne({});
    if (!user) {
      console.log('No user found, creating a test user');
      user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716] // Bangalore
        },
        discoveryRadius: 5
      });
    } else if (!user.location || !user.location.coordinates || user.location.coordinates.length !== 2) {
      console.log('Updating user with location');
      user.location = {
        type: 'Point',
        coordinates: [77.5946, 12.9716] // Bangalore
      };
      await user.save();
    }
    const userId = user._id.toString();
    console.log(`Using user: ${userId} (${user.email})`);

    // 2. Create a test post
    console.log('\n--- Creating Test Post ---');
    const post = await postService.createPost(userId, {
      content: `PLASO FEED TEST - ${Date.now()}`,
      visibility: 'PUBLIC' as any,
      location: { longitude: 77.5946, latitude: 12.9716 }
    });
    console.log(`Created Post ID: ${post._id}`);
    
    // Check direct DB retrieval
    const dbPost = await Post.findById(post._id);
    console.log('DB Post:', {
      _id: dbPost?._id,
      author: dbPost?.author,
      content: dbPost?.content,
      visibility: dbPost?.visibility,
      location: dbPost?.location
    });

    // 3. Test HOME Feed
    console.log('\n--- Testing HOME Feed ---');
    const homeFeed = await postService.getFeed(userId, 1, 10, 'home');
    const inHome = homeFeed.posts.find(p => p._id.toString() === post._id.toString());
    console.log(`Found in HOME: ${!!inHome}`);
    if (!inHome) {
      console.log('First 3 posts in Home:', homeFeed.posts.slice(0, 3).map(p => ({_id: p._id, content: p.content, author: p.author?._id})));
    }

    // 4. Test NEARBY Feed
    console.log('\n--- Testing NEARBY Feed ---');
    const nearbyFeed = await postService.getFeed(userId, 1, 10, 'nearby');
    const inNearby = nearbyFeed.posts.find(p => p._id.toString() === post._id.toString());
    console.log(`Found in NEARBY: ${!!inNearby}`);
    if (!inNearby) {
      console.log('First 3 posts in Nearby:', nearbyFeed.posts.slice(0, 3).map(p => ({_id: p._id, content: p.content, author: p.author?._id})));
    }
    
    // Clean up
    await Post.findByIdAndDelete(post._id);
    console.log('\nCleaned up test post.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
