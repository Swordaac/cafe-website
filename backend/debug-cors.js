#!/usr/bin/env node

/**
 * CORS Debug Script
 * 
 * This script helps debug CORS environment variable issues
 */

console.log('🔍 Debugging CORS Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('ALLOWED_ORIGINS:', process.env.ALLOWED_ORIGINS || 'undefined');
console.log('PORT:', process.env.PORT || 'undefined');

// Simulate the getList function
function getList(name, fallback = []) {
  const raw = process.env[name];
  console.log(`\n🔧 Processing ${name}:`);
  console.log(`  Raw value: "${raw}"`);
  console.log(`  Is empty: ${!raw || raw.trim() === ''}`);
  
  if (!raw || raw.trim() === '') {
    console.log(`  Using fallback: [${fallback.map(s => `"${s}"`).join(', ')}]`);
    return fallback;
  }
  
  const result = raw.split(',').map((s) => s.trim()).filter(Boolean);
  console.log(`  Parsed result: [${result.map(s => `"${s}"`).join(', ')}]`);
  return result;
}

// Test the CORS configuration
const allowedOrigins = getList('ALLOWED_ORIGINS', ['http://localhost:3000', 'http://localhost:3001', '*']);

console.log('\n✅ Final CORS Configuration:');
console.log('CORS allowed origins:', allowedOrigins);

console.log('\n💡 Troubleshooting Tips:');
if (!process.env.ALLOWED_ORIGINS) {
  console.log('❌ ALLOWED_ORIGINS is not set in environment variables');
  console.log('   Make sure to set it in your Render dashboard');
} else {
  console.log('✅ ALLOWED_ORIGINS is set');
  if (process.env.ALLOWED_ORIGINS.includes('@')) {
    console.log('⚠️  Found "@" in ALLOWED_ORIGINS - this might be causing issues');
    console.log('   Try removing the "@" symbol from your environment variable');
  }
}

console.log('\n📝 Expected format:');
console.log('ALLOWED_ORIGINS=https://cafe-website-mocha.vercel.app,http://localhost:3000');



