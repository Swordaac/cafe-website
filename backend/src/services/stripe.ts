import Stripe from 'stripe';
import { env } from '../config/env.js';
import { PlatformConfig } from '../models/PlatformConfig.js';
import { Tenant } from '../models/Tenant.js';

export const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: '2025-09-30.clover',
});

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

export async function ensureConnectedAccount(tenantId: string): Promise<string> {
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


