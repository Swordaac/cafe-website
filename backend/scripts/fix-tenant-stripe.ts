import { config } from 'dotenv';
import { MongoClient } from 'mongodb';
import Stripe from 'stripe';
import { Tenant } from '../src/models/Tenant.js';

// Load environment variables
config({ path: '.env' });

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

async function fixTenantStripe() {
  console.log('🔧 Fixing tenant Stripe configuration...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    // List all tenants
    console.log('📋 Listing all tenants...');
    const tenants = await Tenant.find({}).lean();
    console.log(`Found ${tenants.length} tenants:`);
    
    tenants.forEach((tenant, index) => {
      console.log(`   ${index + 1}. ${tenant._id} - ${tenant.name}`);
      if (tenant.stripe?.accountId) {
        console.log(`      Stripe Account: ${tenant.stripe.accountId}`);
        console.log(`      Charges Enabled: ${tenant.stripe.chargesEnabled}`);
      } else {
        console.log(`      No Stripe account configured`);
      }
    });
    console.log('');

    // Ask user to select tenant to fix
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const tenantId = await new Promise<string>((resolve) => {
      rl.question('Enter tenant ID to fix (or press Enter to create new): ', (answer) => {
        resolve(answer.trim());
      });
    });

    let tenant;
    if (tenantId) {
      tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        console.log(`❌ Tenant ${tenantId} not found`);
        process.exit(1);
      }
      console.log(`✅ Found tenant: ${tenant.name}`);
    } else {
      // Create new tenant
      const newTenantId = 'cafe-' + Date.now();
      tenant = new Tenant({
        _id: newTenantId,
        name: 'Cafe Test',
        domain: 'cafe-test.localhost',
      });
      await tenant.save();
      console.log(`✅ Created new tenant: ${newTenantId}`);
    }

    // Create new Stripe account
    console.log('\n💳 Creating new Stripe Express account...');
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

    // Update tenant with new Stripe account
    console.log('🔄 Updating tenant with new Stripe account...');
    tenant.stripe = {
      accountId: account.id,
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      detailsSubmitted: Boolean(account.details_submitted),
    };
    
    await tenant.save();
    console.log('✅ Tenant updated successfully\n');

    // Create account link for onboarding
    console.log('🔗 Creating account onboarding link...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'http://localhost:3000/refresh',
      return_url: 'http://localhost:3000/return',
      type: 'account_onboarding',
    });
    
    console.log(`✅ Account onboarding link: ${accountLink.url}\n`);

    // Test payment intent creation
    console.log('🧪 Testing payment intent creation...');
    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: 2000, // $20.00
          currency: 'usd',
          description: 'Test payment after fix',
          metadata: { tenantId: tenant._id, test: 'true' },
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

    // Display final information
    console.log('🎉 Tenant Stripe configuration fixed!\n');
    console.log('Tenant ID:', tenant._id);
    console.log('Stripe Account ID:', account.id);
    console.log('Account Onboarding URL:', accountLink.url);
    console.log('\nNext steps:');
    console.log('1. Complete the Stripe account onboarding using the URL above');
    console.log('2. Use this tenant ID in your frontend requests');
    console.log('3. Test payments after account verification');

    rl.close();
    await client.close();

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixTenantStripe();
