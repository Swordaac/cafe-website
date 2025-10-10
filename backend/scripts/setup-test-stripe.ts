import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import Stripe from 'stripe';
import { Tenant } from '../src/models/Tenant.js';
import { ensureConnectedAccount, createAccountLink } from '../src/services/stripe.js';

// Load environment variables
config({ path: '../.env' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const MONGODB_URI = process.env.MONGODB_URI;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  process.exit(1);
}

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

async function setupTestEnvironment() {
  console.log('🚀 Setting up Stripe test environment...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    // Create a test tenant
    const testTenantId = 'test-cafe-' + Date.now();
    console.log(`🏪 Creating test tenant: ${testTenantId}`);
    
    const tenant = new Tenant({
      _id: testTenantId,
      name: 'Test Cafe',
      domain: 'test-cafe.localhost',
    });
    
    await tenant.save();
    console.log('✅ Test tenant created\n');

    // Create a Stripe Express account for the tenant
    console.log('💳 Creating Stripe Express account...');
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: 'test@example.com',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    
    console.log(`✅ Stripe account created: ${account.id}`);
    
    // Update tenant with Stripe account info
    tenant.stripe = {
      accountId: account.id,
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      detailsSubmitted: Boolean(account.details_submitted),
    };
    
    await tenant.save();
    console.log('✅ Tenant updated with Stripe account info\n');

    // Create account link for onboarding
    console.log('🔗 Creating account onboarding link...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3000/refresh',
      return_url: 'http://localhost:3000/return',
      type: 'account_onboarding',
    });
    
    console.log(`✅ Account onboarding link created: ${accountLink.url}\n`);

    // Test payment intent creation
    console.log('🧪 Testing payment intent creation...');
    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: 2000, // $20.00
          currency: 'usd',
          description: 'Test payment for setup',
          metadata: { tenantId: testTenantId, test: 'true' },
          application_fee_amount: 200, // 10% fee
          automatic_payment_methods: { enabled: true },
        },
        {
          stripeAccount: account.id,
        }
      );
      
      console.log(`✅ Payment intent created successfully: ${paymentIntent.id}`);
      console.log(`   Client secret: ${paymentIntent.client_secret}\n`);
    } catch (paymentError: any) {
      console.log(`⚠️  Payment intent creation failed (expected for unverified account): ${paymentError.message}\n`);
    }

    // Display test information
    console.log('📋 Test Environment Setup Complete!\n');
    console.log('Test Tenant ID:', testTenantId);
    console.log('Stripe Account ID:', account.id);
    console.log('Account Onboarding URL:', accountLink.url);
    console.log('\nNext steps:');
    console.log('1. Complete the Stripe account onboarding using the URL above');
    console.log('2. Use the tenant ID in your frontend requests');
    console.log('3. Test payments after account verification\n');

    // Test API endpoint
    console.log('🧪 Testing API endpoint...');
    const testPaymentData = {
      amount: 2000,
      currency: 'usd',
      description: 'Test payment',
      metadata: { orderId: 'test-123' }
    };

    const response = await fetch('http://localhost:4000/v1/payments/intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': testTenantId,
        'Idempotency-Key': 'test-setup-' + Date.now()
      },
      body: JSON.stringify(testPaymentData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API endpoint test successful!');
      console.log('   Payment Intent ID:', result.data.id);
      console.log('   Client Secret:', result.data.clientSecret);
    } else {
      const error = await response.text();
      console.log('❌ API endpoint test failed:', error);
    }

    await client.close();
    console.log('\n🎉 Setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupTestEnvironment();
