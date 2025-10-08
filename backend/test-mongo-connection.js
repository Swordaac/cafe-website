#!/usr/bin/env node

/**
 * MongoDB Connection Test Script
 * 
 * This script helps debug MongoDB Atlas connection issues.
 * Run with: node test-mongo-connection.js
 */

import mongoose from 'mongoose';

// Get MongoDB URI from environment
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI environment variable is not set');
  process.exit(1);
}

// Mask the URI for logging (hide password)
const maskedUri = mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
console.log('🔍 Testing MongoDB connection with URI:', maskedUri);

// Parse the URI to extract components
try {
  const url = new URL(mongoUri);
  console.log('📋 Connection details:');
  console.log('  - Protocol:', url.protocol);
  console.log('  - Host:', url.hostname);
  console.log('  - Port:', url.port || 'default');
  console.log('  - Database:', url.pathname.substring(1) || 'default');
  console.log('  - Username:', url.username);
  console.log('  - Has Password:', url.password ? 'Yes' : 'No');
  console.log('  - Search Params:', url.search);
} catch (error) {
  console.error('❌ Invalid MongoDB URI format:', error.message);
  process.exit(1);
}

// Test different connection approaches
async function testConnection() {
  console.log('\n🧪 Testing connection approaches...\n');

  // Test 1: Basic connection
  console.log('1️⃣ Testing basic connection...');
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Basic connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ Basic connection failed:', error.message);
  }

  // Test 2: With admin auth source
  console.log('\n2️⃣ Testing with authSource: admin...');
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      authSource: 'admin',
    });
    console.log('✅ Admin auth connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ Admin auth connection failed:', error.message);
  }

  // Test 3: With database auth source
  console.log('\n3️⃣ Testing with authSource: database...');
  try {
    const url = new URL(mongoUri);
    const dbName = url.pathname.substring(1) || 'admin';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      authSource: dbName,
    });
    console.log('✅ Database auth connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ Database auth connection failed:', error.message);
  }

  // Test 4: With retryWrites and write concern
  console.log('\n4️⃣ Testing with retryWrites and write concern...');
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority',
    });
    console.log('✅ RetryWrites connection successful');
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ RetryWrites connection failed:', error.message);
  }

  console.log('\n🏁 Connection tests completed');
}

// Run the tests
testConnection().catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
