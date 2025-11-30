import Stripe from 'stripe';
import { env } from '../config/env.js';
import { PlatformConfig } from '../models/PlatformConfig.js';
import { Tenant } from '../models/Tenant.js';

// Only initialize Stripe if API key is provided
export const stripe = env.stripe.secretKey 
  ? new Stripe(env.stripe.secretKey, {
      apiVersion: '2025-09-30.clover',
    })
  : null;

export async function getPlatformFeeBps(): Promise<number> {
  const cfg = await PlatformConfig.findById('platform').lean();
  if (cfg?.stripe?.applicationFeeBps != null) return cfg.stripe.applicationFeeBps;
  return env.stripe.applicationFeeBps;
}

export async function getDefaultCurrency(): Promise<string> {
  const cfg = await PlatformConfig.findById('platform').lean();
  if (cfg?.stripe?.defaultCurrency) return cfg.stripe.defaultCurrency;
  return env.stripe.defaultCurrency;
}

/**
 * Get Stripe account ID for a tenant
 * In development, returns a hardcoded test account ID
 * In production, fetches from database or creates a new one
 */
export async function getStripeAccountId(tenantId: string): Promise<string> {
  // In development, use hardcoded test account ID
  if (env.nodeEnv === 'development') {
    const testAccountId = process.env.STRIPE_TEST_ACCOUNT_ID || 'acct_1SFgpED8TJhQz6vX';
    console.log(`[Stripe] Using test account ID for development: ${testAccountId}`);
    return testAccountId;
  }

  // In production, use the database value
  return await ensureConnectedAccount(tenantId);
}

export async function ensureConnectedAccount(tenantId: string): Promise<string> {
  if (!stripe) throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new Error('Tenant not found');
  if (tenant.stripe?.accountId) return tenant.stripe.accountId;

  const account = await stripe.accounts.create({ type: 'express' });
  tenant.stripe = {
    ...tenant.stripe,
    accountId: account.id,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
  };
  await tenant.save();
  return account.id;
}

export async function createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
  if (!stripe) throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

export function computeApplicationFeeAmount(amount: number, bps: number): number {
  // Round down to avoid overcharging
  return Math.floor((amount * bps) / 10000);
}


