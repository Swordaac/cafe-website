import { config } from 'dotenv';
import Stripe from 'stripe';

config({ path: '.env' });

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const CONNECT_ACCOUNT_ID = 'acct_1SFgpED8TJhQz6vX';

if (!STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is required');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
});

async function enableCardPayments() {
  try {
    console.log('🔧 Enabling card payments capability...');
    
    // Update the account capabilities
    const account = await stripe.accounts.update(CONNECT_ACCOUNT_ID, {
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log('✅ Account updated successfully!');
    console.log('Capabilities:', account.capabilities);
    console.log('Charges enabled:', account.charges_enabled);
    console.log('Payouts enabled:', account.payouts_enabled);
    
    // Check if we need to create an account link for onboarding
    if (!account.charges_enabled) {
      console.log('\n🔗 Creating account link for onboarding...');
      const accountLink = await stripe.accountLinks.create({
        account: CONNECT_ACCOUNT_ID,
        refresh_url: 'http://localhost:3000/refresh',
        return_url: 'http://localhost:3000/return',
        type: 'account_onboarding',
      });
      
      console.log('📋 Complete onboarding at:', accountLink.url);
      console.log('After completing onboarding, the account will be ready for payments.');
    } else {
      console.log('\n🎉 Account is ready for payments!');
    }

  } catch (error) {
    console.error('❌ Failed to enable card payments:', error);
    process.exit(1);
  }
}

enableCardPayments();
