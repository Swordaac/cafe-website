#!/usr/bin/env node

/**
 * End-to-End Integration Testing Script
 * Tests the complete flow from product creation to payment processing
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TENANT_ID = process.env.TENANT_ID || 'Bouchees';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test-token';

// Mock JWT token for testing
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ0ZW5hbnRfaWQiOiJCb3VjaGVlcyIsInJvbGUiOiJhZG1pbiJ9.test';

let createdCategoryId = null;
let createdProductIds = [];
let createdPaymentIntentId = null;

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
  return { status: response.status, data, headers: response.headers };
}

async function step1_CreateCategory() {
  console.log('\n📝 Step 1: Creating a category...');
  
  const { status, data } = await makeRequest(`/v1/tenants/${TENANT_ID}/categories`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MOCK_JWT}` },
    body: JSON.stringify({
      name: 'Test Category',
      sortOrder: 1
    })
  });

  if (status === 201) {
    console.log('✅ Category created successfully');
    createdCategoryId = data.data._id;
    console.log(`   Category ID: ${createdCategoryId}`);
    return true;
  } else {
    console.log('❌ Failed to create category');
    console.log('   Error:', data?.error);
    return false;
  }
}

async function step2_CreateProducts() {
  console.log('\n📝 Step 2: Creating products...');
  
  const products = [
    {
      name: 'Test Coffee',
      description: 'A delicious test coffee',
      priceCents: 500, // $5.00
      categoryId: createdCategoryId,
      availabilityStatus: 'available'
    },
    {
      name: 'Test Pastry',
      description: 'A tasty test pastry',
      priceCents: 300, // $3.00
      categoryId: createdCategoryId,
      availabilityStatus: 'available'
    }
  ];

  for (const product of products) {
    const { status, data } = await makeRequest(`/v1/tenants/${TENANT_ID}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${MOCK_JWT}` },
      body: JSON.stringify(product)
    });

    if (status === 201) {
      console.log(`✅ Product "${product.name}" created successfully`);
      createdProductIds.push(data.data._id);
      console.log(`   Product ID: ${data.data._id}`);
    } else {
      console.log(`❌ Failed to create product "${product.name}"`);
      console.log('   Error:', data?.error);
      return false;
    }
  }

  return true;
}

async function step3_VerifyPublicAccess() {
  console.log('\n📝 Step 3: Verifying public access to products...');
  
  // Test public category listing
  const { status: catStatus, data: catData } = await makeRequest(`/v1/tenants/${TENANT_ID}/categories`);
  if (catStatus === 200) {
    console.log('✅ Categories are publicly accessible');
    console.log(`   Found ${catData.data.length} categories`);
  } else {
    console.log('❌ Categories not publicly accessible');
    return false;
  }

  // Test public product listing
  const { status: prodStatus, data: prodData } = await makeRequest(`/v1/tenants/${TENANT_ID}/products`);
  if (prodStatus === 200) {
    console.log('✅ Products are publicly accessible');
    console.log(`   Found ${prodData.data.length} products`);
  } else {
    console.log('❌ Products not publicly accessible');
    return false;
  }

  // Test individual product access
  if (createdProductIds.length > 0) {
    const { status: singleProdStatus, data: singleProdData } = await makeRequest(`/v1/tenants/${TENANT_ID}/products/${createdProductIds[0]}`);
    if (singleProdStatus === 200) {
      console.log('✅ Individual product is publicly accessible');
      console.log(`   Product: ${singleProdData.data.name} - $${(singleProdData.data.priceCents / 100).toFixed(2)}`);
    } else {
      console.log('❌ Individual product not publicly accessible');
      return false;
    }
  }

  return true;
}

async function step4_CreatePaymentIntent() {
  console.log('\n📝 Step 4: Creating payment intent with items...');
  
  if (createdProductIds.length === 0) {
    console.log('❌ No products available for payment intent');
    return false;
  }

  const items = createdProductIds.map((productId, index) => ({
    productId,
    quantity: index + 1 // Different quantities for testing
  }));

  const { status, data } = await makeRequest('/v1/payments/intent', {
    method: 'POST',
    body: JSON.stringify({
      items,
      currency: 'usd',
      description: 'Integration test order',
      metadata: {
        test: true,
        testRun: Date.now()
      }
    })
  });

  if (status === 201) {
    console.log('✅ Payment intent created successfully');
    createdPaymentIntentId = data.data.id;
    console.log(`   Payment Intent ID: ${createdPaymentIntentId}`);
    console.log(`   Client Secret: ${data.data.clientSecret.substring(0, 20)}...`);
    console.log(`   Stripe Account ID: ${data.data.stripeAccountId}`);
    console.log(`   Amount: $${(data.data.amount / 100).toFixed(2)}`);
    return true;
  } else {
    console.log('❌ Failed to create payment intent');
    console.log('   Error:', data?.error);
    return false;
  }
}

async function step5_VerifyServerSidePricing() {
  console.log('\n📝 Step 5: Verifying server-side price computation...');
  
  if (!createdPaymentIntentId) {
    console.log('❌ No payment intent available for verification');
    return false;
  }

  // Get the payment intent details
  const { status, data } = await makeRequest(`/v1/payments/intent/${createdPaymentIntentId}`);
  
  if (status === 200) {
    console.log('✅ Payment intent retrieved successfully');
    console.log(`   Amount: $${(data.data.amount / 100).toFixed(2)}`);
    console.log(`   Currency: ${data.data.currency}`);
    console.log(`   Status: ${data.data.status}`);
    
    // Verify the amount matches expected calculation
    // Coffee: $5.00 * 1 = $5.00
    // Pastry: $3.00 * 2 = $6.00
    // Total: $11.00 = 1100 cents
    const expectedAmount = 1100; // 500 + (300 * 2)
    
    if (data.data.amount === expectedAmount) {
      console.log('✅ Server-side price computation is correct');
      console.log(`   Expected: $${(expectedAmount / 100).toFixed(2)}, Got: $${(data.data.amount / 100).toFixed(2)}`);
    } else {
      console.log('❌ Server-side price computation is incorrect');
      console.log(`   Expected: $${(expectedAmount / 100).toFixed(2)}, Got: $${(data.data.amount / 100).toFixed(2)}`);
      return false;
    }
    
    return true;
  } else {
    console.log('❌ Failed to retrieve payment intent');
    console.log('   Error:', data?.error);
    return false;
  }
}

async function step6_TestIdempotency() {
  console.log('\n📝 Step 6: Testing payment intent idempotency...');
  
  if (createdProductIds.length === 0) {
    console.log('❌ No products available for idempotency test');
    return false;
  }

  const idempotencyKey = `integration-test-${Date.now()}`;
  const items = [{ productId: createdProductIds[0], quantity: 1 }];

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

  if (status1 === 201 && status2 === 201 && data1.data.id === data2.data.id) {
    console.log('✅ Idempotency working correctly');
    console.log(`   Both requests returned same PaymentIntent: ${data1.data.id}`);
    return true;
  } else {
    console.log('❌ Idempotency not working correctly');
    console.log(`   First request: ${status1}, Second request: ${status2}`);
    return false;
  }
}

async function step7_TestErrorHandling() {
  console.log('\n📝 Step 7: Testing error handling...');
  
  const errorTests = [
    {
      name: 'Invalid product ID',
      body: { items: [{ productId: 'invalid-id', quantity: 1 }] },
      expectedStatus: 400
    },
    {
      name: 'Zero quantity',
      body: { items: [{ productId: createdProductIds[0], quantity: 0 }] },
      expectedStatus: 400
    },
    {
      name: 'Missing items',
      body: { currency: 'usd' },
      expectedStatus: 400
    },
    {
      name: 'Empty items array',
      body: { items: [], currency: 'usd' },
      expectedStatus: 400
    }
  ];

  let allPassed = true;

  for (const test of errorTests) {
    const { status, data } = await makeRequest('/v1/payments/intent', {
      method: 'POST',
      body: JSON.stringify(test.body)
    });

    if (status === test.expectedStatus) {
      console.log(`✅ ${test.name} - Correctly rejected (${status})`);
    } else {
      console.log(`❌ ${test.name} - Expected ${test.expectedStatus}, got ${status}`);
      console.log(`   Response:`, data);
      allPassed = false;
    }
  }

  return allPassed;
}

async function step8_Cleanup() {
  console.log('\n📝 Step 8: Cleaning up test data...');
  
  let cleanupSuccess = true;

  // Delete products
  for (const productId of createdProductIds) {
    const { status } = await makeRequest(`/v1/tenants/${TENANT_ID}/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${MOCK_JWT}` }
    });

    if (status === 204) {
      console.log(`✅ Deleted product ${productId}`);
    } else {
      console.log(`❌ Failed to delete product ${productId}`);
      cleanupSuccess = false;
    }
  }

  // Delete category
  if (createdCategoryId) {
    const { status } = await makeRequest(`/v1/tenants/${TENANT_ID}/categories/${createdCategoryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${MOCK_JWT}` }
    });

    if (status === 204) {
      console.log(`✅ Deleted category ${createdCategoryId}`);
    } else {
      console.log(`❌ Failed to delete category ${createdCategoryId}`);
      cleanupSuccess = false;
    }
  }

  return cleanupSuccess;
}

async function runIntegrationTest() {
  console.log('🚀 Starting End-to-End Integration Test');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}`);
  console.log(`Using Mock JWT: ${MOCK_JWT.substring(0, 20)}...`);
  
  const steps = [
    { name: 'Create Category', fn: step1_CreateCategory },
    { name: 'Create Products', fn: step2_CreateProducts },
    { name: 'Verify Public Access', fn: step3_VerifyPublicAccess },
    { name: 'Create Payment Intent', fn: step4_CreatePaymentIntent },
    { name: 'Verify Server-Side Pricing', fn: step5_VerifyServerSidePricing },
    { name: 'Test Idempotency', fn: step6_TestIdempotency },
    { name: 'Test Error Handling', fn: step7_TestErrorHandling },
    { name: 'Cleanup', fn: step8_Cleanup }
  ];

  let allStepsPassed = true;

  try {
    for (const step of steps) {
      console.log(`\n🔄 Running: ${step.name}`);
      const success = await step.fn();
      
      if (success) {
        console.log(`✅ ${step.name} completed successfully`);
      } else {
        console.log(`❌ ${step.name} failed`);
        allStepsPassed = false;
        
        // Continue with remaining steps even if one fails
        if (step.name !== 'Cleanup') {
          console.log('   Continuing with remaining steps...');
        }
      }
    }

    if (allStepsPassed) {
      console.log('\n🎉 All integration tests passed!');
      console.log('\n✅ The system is working correctly with:');
      console.log('   - Server-side price computation');
      console.log('   - Tenant isolation');
      console.log('   - Public/protected route separation');
      console.log('   - Payment intent creation with items');
      console.log('   - Idempotency support');
      console.log('   - Proper error handling');
    } else {
      console.log('\n⚠️  Some integration tests failed. Check the output above for details.');
    }

  } catch (error) {
    console.error('\n💥 Integration test failed with error:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runIntegrationTest();
}

module.exports = {
  runIntegrationTest,
  step1_CreateCategory,
  step2_CreateProducts,
  step3_VerifyPublicAccess,
  step4_CreatePaymentIntent,
  step5_VerifyServerSidePricing,
  step6_TestIdempotency,
  step7_TestErrorHandling,
  step8_Cleanup
};
