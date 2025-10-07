import { Router } from 'express';
import { authSupabase } from '../middlewares/authSupabase.js';
import { resolveTenant } from '../middlewares/tenant.js';
import { stripe, getPlatformFeeBps, computeApplicationFeeAmount, getDefaultCurrency } from '../services/stripe.js';
import { Tenant } from '../models/Tenant.js';
import { Transaction } from '../models/Transaction.js';

export const router = Router();

// Create PaymentIntent on connected account with application fee to platform
router.post('/payments/intent', resolveTenant, async (req, res, next) => {
  try {
    const tenantId = req.tenant!.id;
    const tenant = await Tenant.findById(tenantId).lean();
    if (!tenant?.stripe?.accountId || !tenant.stripe.chargesEnabled) {
      return res.status(400).json({ error: 'Tenant is not ready to accept payments' });
    }

    const { amount, currency, description, metadata } = req.body ?? {};
    if (!amount || amount <= 0) return res.status(400).json({ error: 'amount required' });

    const bps = await getPlatformFeeBps();
    const fee = computeApplicationFeeAmount(amount, bps);
    const finalCurrency = (currency as string) || (await getDefaultCurrency());

    const idempotencyKey = req.header('Idempotency-Key') || undefined;

    const pi = await stripe.paymentIntents.create(
      {
        amount,
        currency: finalCurrency,
        description,
        metadata: { ...metadata, tenantId },
        application_fee_amount: fee,
        automatic_payment_methods: { enabled: true },
      },
      {
        idempotencyKey,
        stripeAccount: tenant.stripe.accountId,
      }
    );

    await Transaction.findByIdAndUpdate(
      pi.id,
      {
        _id: pi.id,
        tenantId,
        amount: pi.amount,
        currency: pi.currency,
        applicationFeeAmount: fee,
        stripeAccountId: tenant.stripe.accountId,
        status: pi.status as any,
        type: 'payment_intent',
        metadata: pi.metadata as any,
      },
      { upsert: true }
    );

    return res.status(201).json({ data: { clientSecret: pi.client_secret, id: pi.id } });
  } catch (error) {
    return next(error);
  }
});


