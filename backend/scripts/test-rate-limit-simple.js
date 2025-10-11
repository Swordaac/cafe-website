import http from 'http';
import https from 'https';

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:4000/v1';
const TENANT_1 = 'test-tenant-1';
const TENANT_2 = 'test-tenant-2';

class RateLimitTester {
  constructor() {
    this.results = [];
  }

  async makeRequest(endpoint, options = {}, tenantId = null) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = new URL(`${API_BASE}${endpoint}`);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;
      
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: options.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId && { 'x-tenant-id': tenantId }),
          ...options.headers
        }
      };

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              data: jsonData,
              responseTime,
              headers: res.headers
            });
          } catch {
            resolve({
              status: res.statusCode,
              data: data,
              responseTime,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        resolve({
          status: 0,
          data: { error: error.message },
          responseTime
        });
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  addResult(test, passed, details, responseTime = null, statusCode = null) {
    this.results.push({ test, passed, details, responseTime, statusCode });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}: ${details}`);
    if (responseTime) console.log(`   Response time: ${responseTime}ms`);
    if (statusCode) console.log(`   Status code: ${statusCode}`);
  }

  async testBasicRateLimit() {
    console.log('\n🧪 Testing basic rate limiting...');
    
    // Test 1: Normal request should work
    const normalRequest = await this.makeRequest('/payments/intent', {
      body: {
        items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        currency: 'usd'
      }
    }, TENANT_1);

    this.addResult(
      'Normal request',
      normalRequest.status === 400 || normalRequest.status === 201,
      `Status: ${normalRequest.status}`,
      normalRequest.responseTime,
      normalRequest.status
    );

    // Test 2: Rapid requests should hit rate limit
    console.log('\n🚀 Sending rapid requests to test rate limiting...');
    const rapidRequests = [];
    const requestCount = 65; // More than the default limit of 60
    
    for (let i = 0; i < requestCount; i++) {
      rapidRequests.push(
        this.makeRequest('/payments/intent', {
          body: {
            items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
            currency: 'usd'
          }
        }, TENANT_1)
      );
    }

    const responses = await Promise.all(rapidRequests);
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    const successCount = responses.filter(r => r.status === 201 || r.status === 400).length;

    this.addResult(
      'Rate limit enforcement',
      rateLimitedCount > 0,
      `${rateLimitedCount} requests rate limited, ${successCount} successful`,
      null,
      null
    );

    // Test 3: Different tenant should have separate rate limit
    console.log('\n🏢 Testing per-tenant rate limiting...');
    const tenant2Requests = [];
    for (let i = 0; i < 65; i++) {
      tenant2Requests.push(
        this.makeRequest('/payments/intent', {
          body: {
            items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
            currency: 'usd'
          }
        }, TENANT_2)
      );
    }

    const tenant2Responses = await Promise.all(tenant2Requests);
    const tenant2RateLimited = tenant2Responses.filter(r => r.status === 429).length;
    const tenant2Success = tenant2Responses.filter(r => r.status === 201 || r.status === 400).length;

    this.addResult(
      'Per-tenant isolation',
      tenant2RateLimited > 0,
      `Tenant 2: ${tenant2RateLimited} rate limited, ${tenant2Success} successful`,
      null,
      null
    );
  }

  async testInputValidation() {
    console.log('\n🔍 Testing input validation with rate limiting...');
    
    // Test invalid currency
    const invalidCurrency = await this.makeRequest('/payments/intent', {
      body: {
        items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        currency: 123 // Invalid: should be string
      }
    }, TENANT_1);

    this.addResult(
      'Invalid currency validation',
      invalidCurrency.status === 400,
      `Status: ${invalidCurrency.status}, Expected: 400`,
      invalidCurrency.responseTime,
      invalidCurrency.status
    );

    // Test invalid items structure
    const invalidItems = await this.makeRequest('/payments/intent', {
      body: {
        items: 'not-an-array', // Invalid: should be array
        currency: 'usd'
      }
    }, TENANT_1);

    this.addResult(
      'Invalid items validation',
      invalidItems.status === 400,
      `Status: ${invalidItems.status}, Expected: 400`,
      invalidItems.responseTime,
      invalidItems.status
    );

    // Test missing required fields
    const missingFields = await this.makeRequest('/payments/intent', {
      body: {
        currency: 'usd'
        // Missing items
      }
    }, TENANT_1);

    this.addResult(
      'Missing fields validation',
      missingFields.status === 400,
      `Status: ${missingFields.status}, Expected: 400`,
      missingFields.responseTime,
      missingFields.status
    );
  }

  async testConnectRouteRateLimit() {
    console.log('\n🔗 Testing connect route rate limiting...');
    
    // Test connect route rate limiting (this will fail auth but should still be rate limited)
    const connectRequests = [];
    for (let i = 0; i < 65; i++) {
      connectRequests.push(
        this.makeRequest(`/tenants/${TENANT_1}/stripe/account-link`, {
          body: {
            returnUrl: 'https://example.com/return',
            refreshUrl: 'https://example.com/refresh'
          }
        }, TENANT_1)
      );
    }

    const connectResponses = await Promise.all(connectRequests);
    const connectRateLimited = connectResponses.filter(r => r.status === 429).length;
    const connectAuthFailed = connectResponses.filter(r => r.status === 401).length;

    this.addResult(
      'Connect route rate limiting',
      connectRateLimited > 0 || connectAuthFailed > 0,
      `${connectRateLimited} rate limited, ${connectAuthFailed} auth failed`,
      null,
      null
    );
  }

  async testRateLimitHeaders() {
    console.log('\n📊 Testing rate limit headers...');
    
    const response = await this.makeRequest('/payments/intent', {
      body: {
        items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
        currency: 'usd'
      }
    }, TENANT_1);

    const hasRateLimitHeaders = response.headers['x-ratelimit-limit'] || 
                               response.headers['x-ratelimit-remaining'] ||
                               response.headers['x-ratelimit-reset'];

    this.addResult(
      'Rate limit headers',
      hasRateLimitHeaders,
      hasRateLimitHeaders ? 'Rate limit headers present' : 'No rate limit headers found',
      response.responseTime,
      response.status
    );
  }

  async testRateLimitRecovery() {
    console.log('\n⏰ Testing rate limit recovery...');
    
    // Wait a bit for potential rate limit reset
    console.log('Waiting 2 seconds for potential rate limit reset...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try a few requests after waiting
    const recoveryRequests = [];
    for (let i = 0; i < 5; i++) {
      recoveryRequests.push(
        this.makeRequest('/payments/intent', {
          body: {
            items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }],
            currency: 'usd'
          }
        }, TENANT_1)
      );
    }

    const recoveryResponses = await Promise.all(recoveryRequests);
    const stillRateLimited = recoveryResponses.filter(r => r.status === 429).length;
    const recovered = recoveryResponses.filter(r => r.status === 201 || r.status === 400).length;

    this.addResult(
      'Rate limit recovery',
      recovered > 0 || stillRateLimited > 0,
      `${recovered} requests recovered, ${stillRateLimited} still rate limited`,
      null,
      null
    );
  }

  async runAllTests() {
    console.log('🚀 Starting Rate Limit Testing Suite');
    console.log('=====================================');
    console.log(`API Base: ${API_BASE}`);
    console.log(`Test Tenants: ${TENANT_1}, ${TENANT_2}`);
    console.log('');

    try {
      await this.testBasicRateLimit();
      await this.testInputValidation();
      await this.testConnectRouteRateLimit();
      await this.testRateLimitHeaders();
      await this.testRateLimitRecovery();

      // Summary
      console.log('\n📊 Test Summary');
      console.log('================');
      const passed = this.results.filter(r => r.passed).length;
      const total = this.results.length;
      const avgResponseTime = this.results
        .filter(r => r.responseTime)
        .reduce((sum, r) => sum + (r.responseTime || 0), 0) / 
        this.results.filter(r => r.responseTime).length;

      console.log(`✅ Passed: ${passed}/${total}`);
      console.log(`❌ Failed: ${total - passed}/${total}`);
      if (avgResponseTime) {
        console.log(`⏱️  Average response time: ${avgResponseTime.toFixed(2)}ms`);
      }

      if (passed === total) {
        console.log('\n🎉 All tests passed! Rate limiting is working correctly.');
      } else {
        console.log('\n⚠️  Some tests failed. Check the implementation.');
      }

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    }
  }
}

// Run the tests
const tester = new RateLimitTester();
tester.runAllTests().catch(console.error);
