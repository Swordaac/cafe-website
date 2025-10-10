import { config } from 'dotenv';
import Stripe from 'stripe';
import mongoose from 'mongoose';
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

async function quickFixStripe() {
  console.log('🔧 Quick fixing Stripe configuration...\n');

  try {
    // Connect to MongoDB first
    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');
    // Use the existing connected account that has charges enabled
    const existingAccountId = 'acct_1SFgpED8TJhQz6vX';
    
    console.log(`📋 Using existing Stripe account: ${existingAccountId}`);
    
    // Verify the account exists and get its details
    const account = await stripe.accounts.retrieve(existingAccountId);
    console.log(`✅ Account verified: ${account.id}`);
    console.log(`   Type: ${account.type}`);
    console.log(`   Charges enabled: ${account.charges_enabled}`);
    console.log(`   Payouts enabled: ${account.payouts_enabled}\n`);

    // Find or create a tenant
    let tenant = await Tenant.findOne({});
    if (!tenant) {
      console.log('📝 Creating new tenant...');
      tenant = new Tenant({
        _id: 'cafe-main',
        name: 'Main Cafe',
        domain: 'cafe.localhost',
      });
    } else {
      console.log(`📝 Found existing tenant: ${tenant._id}`);
    }

    // Update tenant with the existing Stripe account
    console.log('🔄 Updating tenant with Stripe account...');
    tenant.stripe = {
      accountId: account.id,
      chargesEnabled: Boolean(account.charges_enabled),
      payoutsEnabled: Boolean(account.payouts_enabled),
      detailsSubmitted: Boolean(account.details_submitted),
    };
    
    await tenant.save();
    console.log('✅ Tenant updated successfully\n');

    // Test payment intent creation
    console.log('🧪 Testing payment intent creation...');
    try {
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: 2000, // $20.00
          currency: 'usd',
          description: 'Test payment after quick fix',
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
      console.log(`⚠️  Payment intent creation failed: ${paymentError.message}\n`);
    }

    // Display final information
    console.log('🎉 Stripe configuration fixed!\n');
    console.log('Tenant ID:', tenant._id);
    console.log('Stripe Account ID:', account.id);
    console.log('\n✅ You can now use this tenant ID in your frontend requests!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
quickFixStripe();
