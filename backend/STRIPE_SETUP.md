# Stripe Test Environment Setup

This guide will help you set up a proper Stripe test environment and fix the payment integration issues.

## Problem

The error you're seeing indicates that the Stripe test key doesn't have access to the account 'acct_test_bouchees'. This happens when:

1. The tenant was configured with a Stripe account created using a different API key
2. The Stripe account doesn't exist in the current test environment
3. The account was created in a different Stripe account/workspace

## Solution

We've created several scripts to help you set up a proper test environment:

### 1. Debug Current Stripe Configuration

First, let's see what's currently configured:

```bash
cd backend
pnpm run debug:stripe
```

This will:
- Check your current Stripe API key access
- List all connected accounts
- Test access to the problematic account
- Create a new test account
- Test payment intent creation

### 2. Fix Existing Tenant

If you have an existing tenant that needs fixing:

```bash
cd backend
pnpm run fix:stripe
```

This will:
- List all existing tenants
- Let you select one to fix or create a new one
- Create a new Stripe Express account
- Update the tenant with the new account
- Provide an onboarding link

### 3. Set Up Complete Test Environment

For a fresh start:

```bash
cd backend
pnpm run setup:stripe
```

This will:
- Create a new test tenant
- Set up a Stripe Express account
- Configure everything properly
- Test the payment flow
- Provide all necessary information

### 4. Test Payment Endpoint

After setting up, test the payment endpoint:

```bash
cd backend
TEST_TENANT_ID=your-tenant-id pnpm run test:payment
```

Or set the tenant ID in your environment:

```bash
export TEST_TENANT_ID=your-tenant-id
pnpm run test:payment
```

## Environment Variables

Make sure you have these environment variables set in your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_APP_FEE_BPS=1000
STRIPE_DEFAULT_CURRENCY=usd
MONGODB_URI=mongodb://...
```

## Stripe Account Onboarding

After creating a Stripe Express account, you need to complete the onboarding process:

1. Use the onboarding URL provided by the scripts
2. Complete the account setup in Stripe's dashboard
3. Enable payments for the account
4. Test payments after verification

## Testing Payments

### Using the API directly:

```bash
curl -X POST http://localhost:4000/v1/payments/intent \
  -H 'x-tenant-id: your-tenant-id' \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: test-123' \
  -d '{"amount":2000,"currency":"usd","description":"Test order","metadata":{"orderId":"o_123"}}'
```

### Using the test script:

```bash
cd backend
TEST_TENANT_ID=your-tenant-id pnpm run test:payment
```

## Frontend Integration

In your frontend, make sure to:

1. Use the correct tenant ID in the `x-tenant-id` header
2. Handle the client secret returned from the payment intent
3. Complete the payment using Stripe's frontend SDK

Example frontend code:

```javascript
const response = await fetch('/v1/payments/intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': 'your-tenant-id',
    'Idempotency-Key': 'unique-key-' + Date.now()
  },
  body: JSON.stringify({
    amount: 2000,
    currency: 'usd',
    description: 'Test payment',
    metadata: { orderId: 'test-123' }
  })
});

const { data } = await response.json();
const { clientSecret } = data;

// Use clientSecret with Stripe.js
```

## Troubleshooting

### Common Issues:

1. **"Account does not exist" error**: Run the fix script to create a new account
2. **"Charges not enabled" error**: Complete the Stripe account onboarding
3. **CORS errors**: Check your CORS configuration in the backend
4. **Authentication errors**: Verify your Supabase JWT configuration

### Debug Steps:

1. Run `pnpm run debug:stripe` to check your Stripe configuration
2. Check your `.env` file for correct API keys
3. Verify your MongoDB connection
4. Test the API endpoint directly with curl
5. Check the browser network tab for detailed error messages

## Next Steps

1. Run the debug script to understand the current state
2. Fix or create a new tenant with proper Stripe configuration
3. Complete the Stripe account onboarding
4. Test payments using the provided scripts
5. Integrate with your frontend application

For more help, check the Stripe documentation or contact support.
