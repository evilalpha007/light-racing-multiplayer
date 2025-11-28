import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function getResetToken() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('❌ No users found');
    } else {
      console.log(`Found ${users.length} users:`);
      users.forEach(u => {
        console.log(`- ${u.email} (Token: ${u.resetPasswordToken ? 'YES' : 'NO'})`);
      });
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getResetToken();
