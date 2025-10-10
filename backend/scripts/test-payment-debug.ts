import { config } from 'dotenv';
import Stripe from 'stripe';

// Load environment variables
config({ path: '.env' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

async function debugStripeAccount() {
  console.log('🔍 Debugging Stripe account access...\n');

  try {
    // Test 1: Check if we can access the platform account
    console.log('1. Testing platform account access...');
    const platformAccount = await stripe.accounts.retrieve();
    console.log(`✅ Platform account: ${platformAccount.id}`);
    console.log(`   Type: ${platformAccount.type}`);
    console.log(`   Country: ${platformAccount.country}`);
    console.log(`   Charges enabled: ${platformAccount.charges_enabled}\n`);

    // Test 2: List all connected accounts
    console.log('2. Listing connected accounts...');
    const connectedAccounts = await stripe.accounts.list({ limit: 10 });
    console.log(`✅ Found ${connectedAccounts.data.length} connected accounts:`);
    
    connectedAccounts.data.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.id} (${account.type}) - Charges: ${account.charges_enabled}`);
    });
    console.log('');

    // Test 3: Try to access the specific account mentioned in the error
    const problematicAccountId = 'acct_test_bouchees';
    console.log(`3. Testing access to problematic account: ${problematicAccountId}`);
    
    try {
      const account = await stripe.accounts.retrieve(problematicAccountId);
      console.log(`✅ Account found: ${account.id}`);
      console.log(`   Type: ${account.type}`);
      console.log(`   Charges enabled: ${account.charges_enabled}`);
    } catch (error: any) {
      console.log(`❌ Cannot access account: ${error.message}`);
      console.log('   This account was likely created with a different Stripe key\n');
    }

    // Test 4: Create a new test account
    console.log('4. Creating a new test account...');
    const newAccount = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: 'test@example.com',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    
    console.log(`✅ New test account created: ${newAccount.id}`);
    console.log(`   Type: ${newAccount.type}`);
    console.log(`   Charges enabled: ${newAccount.charges_enabled}\n`);

    // Test 5: Test payment intent creation on the new account
    console.log('5. Testing payment intent creation...');
    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: 2000,
          currency: 'usd',
          description: 'Debug test payment',
          metadata: { test: 'debug' },
          application_fee_amount: 200,
          automatic_payment_methods: { enabled: true },
        },
        {
          stripeAccount: newAccount.id,
        }
      );
      
      console.log(`✅ Payment intent created: ${paymentIntent.id}`);
      console.log(`   Client secret: ${paymentIntent.client_secret}`);
    } catch (error: any) {
      console.log(`⚠️  Payment intent creation failed: ${error.message}`);
      console.log('   This is expected for unverified accounts\n');
    }

    console.log('📋 Debug Summary:');
    console.log(`- Platform account: ${platformAccount.id}`);
    console.log(`- Connected accounts: ${connectedAccounts.data.length}`);
    console.log(`- New test account: ${newAccount.id}`);
    console.log('\n💡 Recommendation:');
    console.log('Use the new test account ID in your tenant configuration');
    console.log('or run the setup script to create a proper test environment.');

  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

// Run the debug
debugStripeAccount();
