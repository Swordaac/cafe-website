#!/usr/bin/env node

// Quick rate limit test - run this to quickly verify rate limiting is working
import http from 'http';

const API_BASE = process.env.API_BASE || 'http://localhost:4000/v1';
const TENANT = 'Bouchees';
const TEST_PRODUCT_ID = '68ddd3215021d7fd3fb4a411';

async function makeRequest(endpoint, tenantId = null) {
  return new Promise((resolve) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantId && { 'x-tenant-id': tenantId })
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
            headers: res.headers
          });
        } catch {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', () => {
      resolve({ status: 0, data: { error: 'Connection failed' } });
    });

    req.write(JSON.stringify({
      items: [{ productId: TEST_PRODUCT_ID, quantity: 1 }],
      currency: 'usd'
    }));
    req.end();
  });
}

async function quickTest() {
  console.log('🚀 Quick Rate Limit Test');
  console.log('========================');
  console.log(`Testing: ${API_BASE}/payments/intent`);
  console.log(`Tenant: ${TENANT}`);
  console.log('');

  // Test 1: Single request
  console.log('1. Testing single request...');
  const single = await makeRequest('/payments/intent', TENANT);
  console.log(`   Status: ${single.status}`);
  
  // Debug: Show all headers
  console.log('   Headers:', single.headers ? Object.keys(single.headers) : 'No headers');
  
  if (single.headers['ratelimit-limit'] || single.headers['x-ratelimit-limit']) {
    const limit = single.headers['ratelimit-limit'] || single.headers['x-ratelimit-limit'];
    const remaining = single.headers['ratelimit-remaining'] || single.headers['x-ratelimit-remaining'];
    console.log(`   Rate limit: ${remaining}/${limit}`);
  }
  
  // Check if we got rate limit headers even with 404 (tenant not found)
  const hasRateLimitHeaders = single.headers['ratelimit-limit'] || single.headers['x-ratelimit-limit'];
  if (hasRateLimitHeaders) {
    console.log('   ✅ Rate limiting is active (headers present)');
  }

  // Test 2: Rapid requests
  console.log('\n2. Sending 10 rapid requests...');
  const requests = [];
  for (let i = 0; i < 10; i++) {
    requests.push(makeRequest('/payments/intent', TENANT));
  }

  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r.status === 429).length;
  const success = responses.filter(r => r.status === 201 || r.status === 400 || r.status === 404).length;

  console.log(`   Rate limited: ${rateLimited}`);
  console.log(`   Successful: ${success}`);

  // Test 3: Check headers
  console.log('\n3. Checking rate limit headers...');
  const headerResponse = responses[0];
  const hasHeaders = headerResponse.headers['ratelimit-limit'] || 
                    headerResponse.headers['x-ratelimit-limit'] ||
                    headerResponse.headers['ratelimit-remaining'] ||
                    headerResponse.headers['x-ratelimit-remaining'];

  if (hasHeaders) {
    console.log('   ✅ Rate limit headers present');
    const limit = headerResponse.headers['ratelimit-limit'] || headerResponse.headers['x-ratelimit-limit'] || 'N/A';
    const remaining = headerResponse.headers['ratelimit-remaining'] || headerResponse.headers['x-ratelimit-remaining'] || 'N/A';
    console.log(`   Limit: ${limit}`);
    console.log(`   Remaining: ${remaining}`);
  } else {
    console.log('   ❌ No rate limit headers found');
  }

  // Summary
  console.log('\n📊 Summary');
  console.log('===========');
  if (rateLimited > 0) {
    console.log('✅ Rate limiting is working! (Requests were rate limited)');
  } else if (success > 0 && hasHeaders) {
    console.log('✅ Rate limiting is working! (Headers present, under limit)');
  } else if (success > 0) {
    console.log('⚠️  Requests working but no rate limiting detected');
    console.log('   (This might be normal if under the limit)');
  } else {
    console.log('❌ No successful requests - check server is running');
  }

  console.log('\n💡 To run full test suite: npm run test:rate-limit');
}

quickTest().catch(console.error);
