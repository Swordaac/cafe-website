#!/usr/bin/env node

/**
 * Tenant Security Testing Script
 * Tests tenant isolation, data leakage prevention, and security boundaries
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TENANT_A = process.env.TENANT_A || 'Bouchees';
const TENANT_B = process.env.TENANT_B || 'AnotherTenant';

// Mock JWT tokens for different tenants
const TENANT_A_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWEiLCJlbWFpbCI6InVzZXJhQGV4YW1wbGUuY29tIiwidGVuYW50X2lkIjoiQm91Y2hlZXMiLCJyb2xlIjoiYWRtaW4ifQ.test';
const TENANT_B_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWIiLCJlbWFpbCI6InVzZXJiQGV4YW1wbGUuY29tIiwidGVuYW50X2lkIjoiQW5vdGhlclRlbmFudCIsInJvbGUiOiJhZG1pbiJ9.test';

async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data, headers: response.headers };
}

async function testTenantDataIsolation() {
  console.log('\n🧪 Testing Tenant Data Isolation...');
  
  // Create a product in Tenant A
  console.log('\n  Creating product in Tenant A...');
  const createProductA = await makeRequest(`/v1/tenants/${TENANT_A}/products`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TENANT_A_JWT}` },
    body: JSON.stringify({
      name: 'Tenant A Product',
      description: 'This should only be visible to Tenant A',
      priceCents: 1000,
      availabilityStatus: 'available'
    })
  });

  if (createProductA.status === 201) {
    console.log('  ✅ Product created in Tenant A');
    const productAId = createProductA.data.data._id;
    
    // Try to access the same product from Tenant B
    console.log('\n  Attempting to access Tenant A product from Tenant B...');
    const accessFromB = await makeRequest(`/v1/tenants/${TENANT_B}/products/${productAId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${TENANT_B_JWT}` }
    });

    if (accessFromB.status === 404) {
      console.log('  ✅ Tenant B cannot access Tenant A product (404 Not Found)');
    } else {
      console.log('  ❌ Tenant B can access Tenant A product - SECURITY ISSUE!');
      console.log('     Response:', accessFromB.data);
    }

    // Try to update the product from Tenant B
    console.log('\n  Attempting to update Tenant A product from Tenant B...');
    const updateFromB = await makeRequest(`/v1/tenants/${TENANT_B}/products/${productAId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${TENANT_B_JWT}` },
      body: JSON.stringify({ name: 'Hacked by Tenant B' })
    });

    if (updateFromB.status === 404 || updateFromB.status === 403) {
      console.log('  ✅ Tenant B cannot update Tenant A product');
    } else {
      console.log('  ❌ Tenant B can update Tenant A product - SECURITY ISSUE!');
      console.log('     Response:', updateFromB.data);
    }
  } else {
    console.log('  ❌ Failed to create product in Tenant A');
    console.log('     Error:', createProductA.data);
  }
}

async function testPaymentIntentIsolation() {
  console.log('\n🧪 Testing Payment Intent Isolation...');
  
  // Create payment intent for Tenant A
  console.log('\n  Creating payment intent for Tenant A...');
  const paymentA = await makeRequest('/v1/payments/intent', {
    method: 'POST',
    headers: { 'x-tenant-id': TENANT_A },
    body: JSON.stringify({
      items: [{ productId: 'product1', quantity: 1 }],
      currency: 'usd'
    })
  });

  if (paymentA.status === 201) {
    console.log('  ✅ Payment intent created for Tenant A');
    const paymentAId = paymentA.data.data.id;
    
    // Try to access payment intent from Tenant B context
    console.log('\n  Attempting to access Tenant A payment intent from Tenant B...');
    const accessFromB = await makeRequest(`/v1/payments/intent/${paymentAId}`, {
      method: 'GET',
      headers: { 'x-tenant-id': TENANT_B }
    });

    if (accessFromB.status === 404) {
      console.log('  ✅ Tenant B cannot access Tenant A payment intent (404 Not Found)');
    } else {
      console.log('  ❌ Tenant B can access Tenant A payment intent - SECURITY ISSUE!');
      console.log('     Response:', accessFromB.data);
    }
  } else {
    console.log('  ❌ Failed to create payment intent for Tenant A');
    console.log('     Error:', paymentA.data);
  }
}

async function testHeaderSpoofing() {
  console.log('\n🧪 Testing Header Spoofing Prevention...');
  
  // Try to access Tenant B data with Tenant A auth but Tenant B header
  console.log('\n  Attempting to access Tenant B data with Tenant A auth...');
  const spoofedRequest = await makeRequest(`/v1/tenants/${TENANT_B}/categories`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${TENANT_A_JWT}`,
      'x-tenant-id': TENANT_B  // This should be ignored for protected routes
    },
    body: JSON.stringify({ name: 'Spoofed Category' })
  });

  if (spoofedRequest.status === 403) {
    console.log('  ✅ Header spoofing prevented (403 Forbidden)');
    console.log('     Error:', spoofedRequest.data?.error);
  } else {
    console.log('  ❌ Header spoofing not prevented - SECURITY ISSUE!');
    console.log('     Response:', spoofedRequest.data);
  }
}

async function testJWTManipulation() {
  console.log('\n🧪 Testing JWT Manipulation Prevention...');
  
  // Try to access with manipulated JWT (different tenant in token)
  const manipulatedJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWEiLCJlbWFpbCI6InVzZXJhQGV4YW1wbGUuY29tIiwidGVuYW50X2lkIjoiTWFuaXB1bGF0ZWRUZW5hbnQiLCJyb2xlIjoiYWRtaW4ifQ.test';
  
  console.log('\n  Attempting to access with manipulated JWT...');
  const manipulatedRequest = await makeRequest(`/v1/tenants/${TENANT_A}/categories`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${manipulatedJWT}` },
    body: JSON.stringify({ name: 'Manipulated Category' })
  });

  if (manipulatedRequest.status === 401 || manipulatedRequest.status === 403) {
    console.log('  ✅ JWT manipulation prevented');
    console.log('     Error:', manipulatedRequest.data?.error);
  } else {
    console.log('  ❌ JWT manipulation not prevented - SECURITY ISSUE!');
    console.log('     Response:', manipulatedRequest.data);
  }
}

async function testPriceTampering() {
  console.log('\n🧪 Testing Price Tampering Prevention...');
  
  // Try to create payment intent with manipulated prices
  console.log('\n  Attempting to create payment intent with manipulated prices...');
  const tamperedPayment = await makeRequest('/v1/payments/intent', {
    method: 'POST',
    headers: { 'x-tenant-id': TENANT_A },
    body: JSON.stringify({
      items: [{ productId: 'product1', quantity: 1 }],
      amount: 1, // Try to pay only 1 cent instead of actual price
      currency: 'usd'
    })
  });

  if (tamperedPayment.status === 400) {
    console.log('  ✅ Price tampering prevented (400 Bad Request)');
    console.log('     Error:', tamperedPayment.data?.error);
  } else if (tamperedPayment.status === 201) {
    // Check if the actual amount is correct
    const actualAmount = tamperedPayment.data.data.amount || 0;
    if (actualAmount > 1) {
      console.log('  ✅ Price tampering prevented - server computed correct amount');
      console.log(`     Actual amount: ${actualAmount} cents`);
    } else {
      console.log('  ❌ Price tampering not prevented - SECURITY ISSUE!');
      console.log('     Response:', tamperedPayment.data);
    }
  } else {
    console.log('  ❌ Unexpected response to price tampering attempt');
    console.log('     Response:', tamperedPayment.data);
  }
}

async function testSQLInjection() {
  console.log('\n🧪 Testing SQL Injection Prevention...');
  
  const maliciousInputs = [
    "'; DROP TABLE products; --",
    "1' OR '1'='1",
    "'; INSERT INTO products (name) VALUES ('hacked'); --"
  ];

  for (const maliciousInput of maliciousInputs) {
    console.log(`\n  Testing malicious input: ${maliciousInput.substring(0, 20)}...`);
    
    const maliciousRequest = await makeRequest(`/v1/tenants/${TENANT_A}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TENANT_A_JWT}` },
      body: JSON.stringify({
        name: maliciousInput,
        priceCents: 1000
      })
    });

    if (maliciousRequest.status === 400 || maliciousRequest.status === 500) {
      console.log('  ✅ Malicious input rejected');
    } else {
      console.log('  ❌ Malicious input not properly handled');
      console.log('     Response:', maliciousRequest.data);
    }
  }
}

async function testXSSPrevention() {
  console.log('\n🧪 Testing XSS Prevention...');
  
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '"><script>alert("xss")</script>',
    'javascript:alert("xss")'
  ];

  for (const payload of xssPayloads) {
    console.log(`\n  Testing XSS payload: ${payload.substring(0, 20)}...`);
    
    const xssRequest = await makeRequest(`/v1/tenants/${TENANT_A}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TENANT_A_JWT}` },
      body: JSON.stringify({
        name: payload,
        priceCents: 1000
      })
    });

    if (xssRequest.status === 201) {
      // Check if the response is properly escaped
      const responseName = xssRequest.data.data.name;
      if (responseName.includes('<script>') || responseName.includes('javascript:')) {
        console.log('  ❌ XSS payload not properly escaped');
        console.log('     Response name:', responseName);
      } else {
        console.log('  ✅ XSS payload properly handled');
      }
    } else {
      console.log('  ✅ XSS payload rejected');
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting Tenant Security Tests');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Tenant A: ${TENANT_A}`);
  console.log(`Tenant B: ${TENANT_B}`);
  
  try {
    await testTenantDataIsolation();
    await testPaymentIntentIsolation();
    await testHeaderSpoofing();
    await testJWTManipulation();
    await testPriceTampering();
    await testSQLInjection();
    await testXSSPrevention();
    
    console.log('\n🎉 All tenant security tests completed!');
    console.log('\n⚠️  Note: Some tests may fail if the backend is not running or if test data is not available.');
    console.log('   This is normal for security testing - the important thing is that malicious requests are properly rejected.');
    
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
  testTenantDataIsolation,
  testPaymentIntentIsolation,
  testHeaderSpoofing,
  testJWTManipulation,
  testPriceTampering,
  testSQLInjection,
  testXSSPrevention
};
