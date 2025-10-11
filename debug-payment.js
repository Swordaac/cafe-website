#!/usr/bin/env node

/**
 * Debug Payment Intent Script
 * Creates test products and then tests payment intent creation
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TENANT_ID = process.env.TENANT_ID || 'Bouchees';

// Mock JWT token for creating products
const MOCK_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ0ZW5hbnRfaWQiOiJCb3VjaGVlcyIsInJvbGUiOiJhZG1pbiJ9.test';

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

async function createTestCategory() {
  console.log('📝 Creating test category...');
  
  const { status, data } = await makeRequest(`/v1/tenants/${TENANT_ID}/categories`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${MOCK_JWT}` },
    body: JSON.stringify({
      name: 'Test Category',
      sortOrder: 1
    })
  });

  if (status === 201) {
    console.log('✅ Category created:', data.data._id);
    return data.data._id;
  } else {
    console.log('❌ Failed to create category:', data);
    return null;
  }
}

async function createTestProducts(categoryId) {
  console.log('📝 Creating test products...');
  
  const products = [
    {
      name: 'Test Coffee',
      description: 'A delicious test coffee',
      priceCents: 500, // $5.00
      categoryId: categoryId,
      availabilityStatus: 'available'
    },
    {
      name: 'Test Pastry',
      description: 'A tasty test pastry',
      priceCents: 300, // $3.00
      categoryId: categoryId,
      availabilityStatus: 'available'
    }
  ];

  const productIds = [];
  
  for (const product of products) {
    const { status, data } = await makeRequest(`/v1/tenants/${TENANT_ID}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${MOCK_JWT}` },
      body: JSON.stringify(product)
    });

    if (status === 201) {
      console.log(`✅ Product "${product.name}" created:`, data.data._id);
      productIds.push(data.data._id);
    } else {
      console.log(`❌ Failed to create product "${product.name}":`, data);
    }
  }

  return productIds;
}

async function testPaymentIntent(productIds) {
  console.log('📝 Testing payment intent creation...');
  
  if (productIds.length === 0) {
    console.log('❌ No products available for payment intent test');
    return;
  }

  const items = productIds.map((productId, index) => ({
    productId,
    quantity: index + 1
  }));

  console.log('Items to test:', items);

  const { status, data } = await makeRequest('/v1/payments/intent', {
    method: 'POST',
    body: JSON.stringify({
      items,
      currency: 'usd',
      description: 'Debug test order',
      metadata: { debug: true }
    })
  });

  console.log(`Status: ${status}`);
  if (status === 201) {
    console.log('✅ Payment intent created successfully');
    console.log('Response:', JSON.stringify(data, null, 2));
  } else {
    console.log('❌ Payment intent creation failed');
    console.log('Error:', JSON.stringify(data, null, 2));
  }
}

async function listProducts() {
  console.log('📝 Listing existing products...');
  
  const { status, data } = await makeRequest(`/v1/tenants/${TENANT_ID}/products`);
  
  console.log(`Status: ${status}`);
  if (status === 200) {
    console.log(`Found ${data.data.length} products:`);
    data.data.forEach(product => {
      console.log(`  - ${product.name} (${product._id}) - $${(product.priceCents / 100).toFixed(2)}`);
    });
    return data.data.map(p => p._id);
  } else {
    console.log('❌ Failed to list products:', data);
    return [];
  }
}

async function runDebug() {
  console.log('🚀 Starting Payment Debug');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Tenant ID: ${TENANT_ID}`);
  
  try {
    // First, check if products already exist
    const existingProducts = await listProducts();
    
    let productIds = existingProducts;
    
    if (existingProducts.length === 0) {
      // Create test data
      const categoryId = await createTestCategory();
      if (categoryId) {
        productIds = await createTestProducts(categoryId);
      }
    } else {
      console.log('Using existing products for testing');
    }
    
    // Test payment intent creation
    await testPaymentIntent(productIds);
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

// Run debug if this script is executed directly
if (require.main === module) {
  runDebug();
}

module.exports = { runDebug };
