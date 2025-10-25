import { MongoClient } from 'mongodb';
import { Membership } from '../dist/models/Membership.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cafe-website';

async function createTestMembership() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get the user ID from command line args
    const userId = process.argv[2];
    if (!userId) {
      console.error('Please provide a user ID as the first argument');
      console.log('Usage: npm run create-membership <userId>');
      process.exit(1);
    }
    
    const tenantId = 'Bouchees';
    const role = 'admin'; // Give admin access for testing
    
    // Check if membership already exists
    const existingMembership = await Membership.findOne({ tenantId, userId });
    if (existingMembership) {
      console.log('Membership already exists:', existingMembership);
      return;
    }
    
    // Create new membership
    const membership = await Membership.create({
      tenantId,
      userId,
      role
    });
    
    console.log('Created membership:', membership);
    console.log(`User ${userId} now has ${role} access to tenant ${tenantId}`);
    
  } catch (error) {
    console.error('Error creating membership:', error);
  } finally {
    await client.close();
  }
}

createTestMembership();
