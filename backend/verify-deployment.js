#!/usr/bin/env node

/**
 * Deployment Verification Script
 * 
 * This script verifies that the latest code changes are deployed
 * and shows what environment variables are required vs optional.
 */

console.log('🔍 Verifying deployment configuration...\n');

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);

// Required environment variables
const required = [
  'MONGODB_URI',
  'SUPABASE_JWT_SECRET'
];

// Optional environment variables
const optional = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET', 
  'STRIPE_APP_FEE_BPS',
  'STRIPE_DEFAULT_CURRENCY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

console.log('\n📋 Required Environment Variables:');
required.forEach(env => {
  const value = process.env[env];
  const status = value ? '✅ Set' : '❌ Missing';
  const masked = env.includes('SECRET') || env.includes('KEY') ? '***' : value;
  console.log(`  ${env}: ${status} ${value ? `(${masked})` : ''}`);
});

console.log('\n🔧 Optional Environment Variables:');
optional.forEach(env => {
  const value = process.env[env];
  const status = value ? '✅ Set' : '⚪ Not set (optional)';
  const masked = env.includes('SECRET') || env.includes('KEY') ? '***' : value;
  console.log(`  ${env}: ${status} ${value ? `(${masked})` : ''}`);
});

// Check MongoDB URI format
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  console.log('\n🗄️  MongoDB URI Analysis:');
  console.log(`  Format: ${mongoUri.startsWith('mongodb+srv://') ? '✅ Atlas' : '❌ Invalid'}`);
  console.log(`  Has Database: ${mongoUri.includes('/cafe_app') ? '✅ Yes' : '⚠️  No (may cause issues)'}`);
  console.log(`  Has RetryWrites: ${mongoUri.includes('retryWrites=true') ? '✅ Yes' : '⚠️  No'}`);
}

console.log('\n🚀 Deployment Status:');
const hasRequired = required.every(env => process.env[env]);
if (hasRequired) {
  console.log('✅ Ready to deploy - all required variables are set');
  console.log('ℹ️  Optional features will be disabled until their variables are set');
} else {
  console.log('❌ Not ready - missing required environment variables');
  console.log('💡 Set the missing required variables to deploy successfully');
}

console.log('\n📝 Next Steps:');
if (!hasRequired) {
  console.log('1. Set missing required environment variables in your deployment platform');
  console.log('2. Redeploy your application');
} else {
  console.log('1. Deploy the latest code to production');
  console.log('2. Set optional environment variables for full functionality');
  console.log('3. Monitor logs for successful MongoDB connection');
}
