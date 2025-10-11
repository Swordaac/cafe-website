# Testing Guide

This directory contains comprehensive testing scripts for the multi-tenant cafe website, focusing on the recent security and architectural improvements.

## Test Suites

### 1. Payment Intent Tests (`test-payment-intent.js`)
Tests the new server-side price computation and items-based payment intent creation.

**What it tests:**
- ✅ Valid payment intent creation with items array
- ✅ Server-side price computation (prevents client tampering)
- ✅ Invalid items rejection (non-existent products, zero quantities)
- ✅ Missing items validation
- ✅ Empty items array rejection
- ✅ Idempotency key support
- ✅ Payment intent retrieval

**Run:**
```bash
node test-payment-intent.js
```

### 2. Middleware Chain Tests (`test-middleware-chains.js`)
Tests the new public/protected route middleware chains and tenant security.

**What it tests:**
- ✅ Public routes work without authentication
- ✅ Protected routes reject unauthenticated requests
- ✅ Protected routes work with valid authentication
- ✅ Tenant mismatch prevention (JWT vs path)
- ✅ Invalid tenant rejection
- ✅ CORS preflight handling
- ✅ Rate limiting (if implemented)

**Run:**
```bash
node test-middleware-chains.js
```

### 3. Tenant Security Tests (`test-tenant-security.js`)
Tests tenant isolation, data leakage prevention, and security boundaries.

**What it tests:**
- ✅ Tenant data isolation (products, categories)
- ✅ Payment intent isolation
- ✅ Header spoofing prevention
- ✅ JWT manipulation prevention
- ✅ Price tampering prevention
- ✅ SQL injection prevention
- ✅ XSS prevention

**Run:**
```bash
node test-tenant-security.js
```

### 4. Integration Tests (`test-integration.js`)
End-to-end integration tests covering the complete flow from product creation to payment processing.

**What it tests:**
- ✅ Complete product lifecycle (create → list → pay)
- ✅ Public access to products and categories
- ✅ Payment intent creation with server-side pricing
- ✅ Idempotency verification
- ✅ Error handling validation
- ✅ Data cleanup

**Run:**
```bash
node test-integration.js
```

## Test Runner

The `test-runner.js` script provides a unified interface to run all tests or specific test suites.

### Run All Tests
```bash
node test-runner.js
```

### Run Specific Test Suite
```bash
# Run payment tests
node test-runner.js payment

# Run middleware tests
node test-runner.js middleware

# Run security tests
node test-runner.js security

# Run integration tests
node test-runner.js integration
```

### Show Help
```bash
node test-runner.js --help
```

## Environment Variables

Configure the tests using these environment variables:

```bash
# Backend API URL (default: http://localhost:4000)
export API_BASE_URL=http://localhost:4000

# Tenant ID for testing (default: Bouchees)
export TENANT_ID=Bouchees

# Authentication token for protected routes
export AUTH_TOKEN=your-jwt-token-here

# Run tests
node test-runner.js
```

## Prerequisites

1. **Backend Server Running**: Ensure the backend server is running on the specified API_BASE_URL
2. **Database Setup**: Ensure MongoDB is running and accessible
3. **Test Data**: Some tests may require existing test data in the database
4. **Node.js**: Ensure Node.js is installed (version 14 or higher)

## Test Data Requirements

The integration tests will create and clean up their own test data, but you may need:

- A valid tenant in the database
- Stripe configuration (for payment tests)
- Valid JWT tokens (for protected route tests)

## Expected Results

### ✅ Successful Test Run
```
🎉 All tests passed! The system is working correctly with:
   - Server-side price computation
   - Tenant isolation
   - Public/protected route separation
   - Payment intent creation with items
   - Idempotency support
   - Proper error handling
```

### ❌ Failed Test Run
```
⚠️  Some tests failed. Please review the output above for details.
```

## Security Testing Notes

The security tests include attempts to:
- Access data from other tenants
- Manipulate JWT tokens
- Tamper with payment amounts
- Inject malicious SQL or XSS payloads

**Expected behavior**: All malicious attempts should be properly rejected with appropriate error codes (400, 401, 403, 404).

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the backend server is running
2. **Authentication Errors**: Check if valid JWT tokens are provided
3. **Database Errors**: Ensure MongoDB is running and accessible
4. **Stripe Errors**: Ensure Stripe is properly configured

### Debug Mode

Add debug logging to see detailed request/response information:

```bash
DEBUG=* node test-runner.js
```

### Individual Test Debugging

Run individual test files directly for easier debugging:

```bash
# Debug payment tests
node test-payment-intent.js

# Debug with environment variables
API_BASE_URL=http://localhost:4000 TENANT_ID=TestTenant node test-payment-intent.js
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run API Tests
  run: |
    npm install
    node test-runner.js
  env:
    API_BASE_URL: ${{ secrets.API_BASE_URL }}
    TENANT_ID: ${{ secrets.TENANT_ID }}
    AUTH_TOKEN: ${{ secrets.AUTH_TOKEN }}
```

## Contributing

When adding new features or making changes:

1. **Add Tests**: Create new test cases for new functionality
2. **Update Existing Tests**: Modify existing tests if behavior changes
3. **Run All Tests**: Ensure all tests pass before submitting changes
4. **Document Changes**: Update this README if new test suites are added

## Test Coverage

The current test suite covers:

- ✅ **Authentication & Authorization**: JWT validation, role-based access
- ✅ **Tenant Isolation**: Data separation, cross-tenant access prevention
- ✅ **Payment Security**: Server-side pricing, tampering prevention
- ✅ **API Security**: Input validation, error handling
- ✅ **Middleware Chains**: Public/protected route separation
- ✅ **Integration Flows**: End-to-end user journeys
- ✅ **Error Handling**: Proper error responses and status codes
- ✅ **Idempotency**: Duplicate request prevention
- ✅ **CORS**: Cross-origin request handling
- ✅ **Input Validation**: Malicious input rejection

This comprehensive test suite ensures the multi-tenant system is secure, reliable, and functioning correctly.
