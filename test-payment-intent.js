#!/usr/bin/env node

/**
 * Payment Intent Testing Script
 * Tests the new server-side price computation and items-based payment intent creation
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TENANT_ID = process.env.TENANT_ID || 'Bouchees';

// Test data
const testItems = [
  { productId: 'product1', quantity: 2 },
  { productId: 'product2', quantity: 1 }
];

const invalidItems = [
  { productId: 'nonexistent', quantity: 1 },
  { productId: 'product1', quantity: 0 }
];

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': TENANT_ID,
      ...options.headers
    },
    ...options
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function testValidPaymentIntent() {
  console.log('\n🧪 Testing valid payment intent creation...');
  
  const { status, data } = await makeRequest('/v1/payments/intent', {
    method: 'POST',
    body: JSON.stringify({
      items: testItems,
      currency: 'usd',
      description: 'Test order',
      metadata: { test: true }
    })
  });

  console.log(`Status: ${status}`);
  if (status === 201) {
    console.log('✅ Payment intent created successfully');
    console.log(`Client Secret: ${data.data.clientSecret.substring(0, 20)}...`);
    console.log(`Payment Intent ID: ${data.data.id}`);
    console.log(`Stripe Account ID: ${data.data.stripeAccountId}`);
    return data.data;
  } else {
    console.log('❌ Failed to create payment intent');
    console.log('Error:', data);
    return null;
  }
}

async function testInvalidItems() {
  console.log('\n🧪 Testing invalid items (should fail)...');
  
  const { status, data } = await makeRequest('/v1/payments/intent', {
    method: 'POST',
    body: JSON.stringify({
      items: invalidItems,
      currency: 'usd'
    })
  });

  console.log(`Status: ${status}`);
  if (status === 400) {
    console.log('✅ Correctly rejected invalid items');
    console.log('Error:', data.error);
  } else {
    console.log('❌ Should have rejected invalid items');
    console.log('Response:', data);
  }
}

async function testMissingItems() {
  console.log('\n🧪 Testing missing items (should fail)...');
  
  const { status, data } = await makeRequest('/v1/payments/intent', {
    method: 'POST',
    body: JSON.stringify({
      currency: 'usd'
    })
  });

  console.log(`Status: ${status}`);
  if (status === 400) {
    console.log('✅ Correctly rejected missing items');
    console.log('Error:', data.error);
  } else {
    console.log('❌ Should have rejected missing items');
    console.log('Response:', data);
  }
}

async function testEmptyItems() {
  console.log('\n🧪 Testing empty items array (should fail)...');
  
  const { status, data } = await makeRequest('/v1/payments/intent', {
    method: 'POST',
    body: JSON.stringify({
      items: [],
      currency: 'usd'
    })
  });

  console.log(`Status: ${status}`);
  if (status === 400) {
    console.log('✅ Correctly rejected empty items');
    console.log('Error:', data.error);
  } else {
    console.log('❌ Should have rejected empty items');
    console.log('Response:', data);
  }
}

async function testIdempotency() {
  console.log('\n🧪 Testing idempotency key...');
  
  const idempotencyKey = `test-${Date.now()}`;
  const items = [{ productId: 'product1', quantity: 1 }];
  
  // First request
  const { status: status1, data: data1 } = await makeRequest('/v1/payments/intent', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ items, currency: 'usd' })
  });
  
  // Second request with same key
  const { status: status2, data: data2 } = await makeRequest('/v1/payments/intent', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ items, currency: 'usd' })
  });

  console.log(`First request status: ${status1}`);
  console.log(`Second request status: ${status2}`);
  
  if (status1 === 201 && status2 === 201 && data1.data.id === data2.data.id) {
    console.log('✅ Idempotency working correctly - same PaymentIntent returned');
  } else {
    console.log('❌ Idempotency not working correctly');
    console.log('First response:', data1);
    console.log('Second response:', data2);
  }
}

async function testPaymentIntentRetrieval(paymentIntentId) {
  if (!paymentIntentId) {
    console.log('\n⏭️  Skipping payment intent retrieval test (no valid payment intent)');
    return;
  }

  console.log('\n🧪 Testing payment intent retrieval...');
  
  const { status, data } = await makeRequest(`/v1/payments/intent/${paymentIntentId}`);
  
  console.log(`Status: ${status}`);
  if (status === 200) {
    console.log('✅ Payment intent retrieved successfully');
    console.log(`Amount: ${data.data.amount}`);
    console.log(`Currency: ${data.data.currency}`);
    console.log(`Status: ${data.data.status}`);
  } else {
    console.log('❌ Failed to retrieve payment intent');
    console.log('Error:', data);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Payment Intent Tests');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}`);
  
  let paymentIntentId = null;
  
  try {
    // Test valid payment intent creation
    const paymentIntent = await testValidPaymentIntent();
    if (paymentIntent) {
      paymentIntentId = paymentIntent.id;
    }
    
    // Test invalid scenarios
    await testInvalidItems();
    await testMissingItems();
    await testEmptyItems();
    
    // Test idempotency
    await testIdempotency();
    
    // Test retrieval
    await testPaymentIntentRetrieval(paymentIntentId);
    
    console.log('\n🎉 All payment intent tests completed!');
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testValidPaymentIntent,
  testInvalidItems,
  testMissingItems,
  testEmptyItems,
  testIdempotency,
  testPaymentIntentRetrieval
};
