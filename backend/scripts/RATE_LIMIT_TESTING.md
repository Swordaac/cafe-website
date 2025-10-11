# Rate Limit Testing

This directory contains comprehensive testing scripts for the per-tenant rate limiting functionality.

## Test Scripts

### 1. `test-rate-limit-simple.js` (Recommended)
- **Command**: `npm run test:rate-limit`
- **Dependencies**: None (uses Node.js built-in modules)
- **Features**:
  - Tests basic rate limiting functionality
  - Tests per-tenant isolation
  - Tests input validation with rate limiting
  - Tests connect route rate limiting
  - Tests rate limit headers
  - Tests rate limit recovery

### 2. `test-rate-limit.ts` (Advanced)
- **Command**: `npm run test:rate-limit-ts`
- **Dependencies**: `node-fetch` (if not installed)
- **Features**: Same as simple version but with TypeScript and more detailed logging

## What the Tests Cover

### Rate Limiting Tests
1. **Basic Rate Limiting**: Sends 65 requests (exceeding the default limit of 60) to verify rate limiting kicks in
2. **Per-Tenant Isolation**: Tests that different tenants have separate rate limit buckets
3. **Rate Limit Recovery**: Tests that rate limits reset after the window period
4. **Rate Limit Headers**: Verifies that rate limit headers are present in responses

### Input Validation Tests
1. **Invalid Currency**: Tests validation of currency field type
2. **Invalid Items Structure**: Tests validation of items array structure
3. **Missing Required Fields**: Tests validation of required fields

### Route-Specific Tests
1. **Payment Intent Route**: Tests rate limiting on `/payments/intent`
2. **Connect Route**: Tests rate limiting on `/tenants/:tenantId/stripe/account-link`

## Configuration

### Environment Variables
- `API_BASE`: API base URL (default: `http://localhost:4000/v1`)
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds (default: 60000)
- `RATE_LIMIT_MAX`: Maximum requests per window (default: 60)

### Test Tenants
- `test-tenant-1`: Primary test tenant
- `test-tenant-2`: Secondary test tenant for isolation testing

## Running the Tests

### Prerequisites
1. Start the backend server:
   ```bash
   npm run dev
   ```

2. Ensure the server is running on the expected port (default: 4000)

### Basic Test Run
```bash
# Simple JavaScript version (recommended)
npm run test:rate-limit

# TypeScript version (requires node-fetch)
npm run test:rate-limit-ts
```

### Custom Configuration
```bash
# Test against different API endpoint
API_BASE=http://localhost:3000/v1 npm run test:rate-limit

# Test with different rate limits
RATE_LIMIT_WINDOW_MS=30000 RATE_LIMIT_MAX=30 npm run test:rate-limit
```

## Expected Results

### Successful Test Run
```
🚀 Starting Rate Limit Testing Suite
=====================================
API Base: http://localhost:4000/v1
Test Tenants: test-tenant-1, test-tenant-2

🧪 Testing basic rate limiting...
✅ Normal request: Status: 400
   Response time: 45ms
   Status code: 400

🚀 Sending rapid requests to test rate limiting...
✅ Rate limit enforcement: 5 requests rate limited, 60 successful

🏢 Testing per-tenant rate limiting...
✅ Per-tenant isolation: Tenant 2: 5 requests rate limited, 60 successful

🔍 Testing input validation with rate limiting...
✅ Invalid currency validation: Status: 400, Expected: 400
✅ Invalid items validation: Status: 400, Expected: 400
✅ Missing fields validation: Status: 400, Expected: 400

🔗 Testing connect route rate limiting...
✅ Connect route rate limiting: 5 rate limited, 60 auth failed

📊 Testing rate limit headers...
✅ Rate limit headers: Rate limit headers present

⏰ Testing rate limit recovery...
✅ Rate limit recovery: 3 requests recovered, 2 still rate limited

📊 Test Summary
================
✅ Passed: 8/8
❌ Failed: 0/8
⏱️  Average response time: 42.5ms

🎉 All tests passed! Rate limiting is working correctly.
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure the backend server is running
   - Check the API_BASE URL is correct

2. **No Rate Limiting Detected**
   - Verify express-rate-limit is installed: `npm install express-rate-limit`
   - Check that rate limiting middleware is properly configured
   - Ensure the server is running the updated code

3. **All Requests Return 400**
   - This is expected for test tenants that don't exist in the database
   - The important thing is that some requests get rate limited (429 status)

4. **TypeScript Version Fails**
   - Install node-fetch: `npm install node-fetch`
   - Or use the simple JavaScript version instead

### Debug Mode
To see more detailed output, you can modify the test scripts to log more information:

```javascript
// Add this to see response details
console.log('Response:', JSON.stringify(response, null, 2));
```

## Rate Limit Configuration

The rate limiting is configured in `src/middlewares/rateLimit.ts`:

```typescript
export function createTenantRateLimiter() {
  return rateLimit({
    windowMs: env.rateLimit.windowMs,    // 60 seconds
    max: env.rateLimit.max,              // 60 requests
    keyGenerator: (req) => {
      const tenantId = req.tenant?.id;
      const base = tenantId || req.ip || 'unknown';
      return `${base}:${req.method}:${req.baseUrl}${req.path}`;
    },
    skip: (req) => req.method !== 'POST', // Only limit POST requests
  });
}
```

## Monitoring Rate Limits

The rate limiting middleware includes standard headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

These headers are automatically included in responses when rate limiting is active.
