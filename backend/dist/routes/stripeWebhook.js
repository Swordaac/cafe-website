import express from 'express';
import { stripe } from '../services/stripe.js';
import { env } from '../config/env.js';
import { StripeEvent } from '../models/StripeEvent.js';
import { Tenant } from '../models/Tenant.js';
import { Transaction } from '../models/Transaction.js';
export const router = express.Router();
// Use raw body for signature verification
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) {
        return res.status(503).json({ error: 'Stripe webhooks are not available. Stripe is not configured.' });
    }
    const sig = req.headers['stripe-signature'];
    if (!sig)
        return res.status(400).send('Missing stripe-signature');
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, env.stripe.webhookSecret);
    }
    catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
        // Idempotency: upsert the event and skip if already processed
        const existing = await StripeEvent.findById(event.id);
        if (existing?.processedAt) {
            return res.status(200).json({ received: true, duplicate: true });
        }
        await StripeEvent.findByIdAndUpdate(event.id, {
            _id: event.id,
            type: event.type,
            apiVersion: event.api_version,
            requestId: event.request?.id ?? null,
            account: event.account ?? null,
            livemode: event.livemode,
            payload: event,
            processedAt: null,
        }, { upsert: true });
        switch (event.type) {
            case 'account.updated': {
                const account = event.data.object;
                const tenant = await Tenant.findOne({ 'stripe.accountId': account.id });
                if (tenant) {
                    tenant.stripe = {
                        ...tenant.stripe,
                        chargesEnabled: Boolean(account.charges_enabled),
                        payoutsEnabled: Boolean(account.payouts_enabled),
                        detailsSubmitted: Boolean(account.details_submitted),
                        onboardingCompletedAt: account.details_submitted ? new Date() : tenant.stripe?.onboardingCompletedAt ?? null,
                    };
                    await tenant.save();
                }
                break;
            }
            case 'payment_intent.succeeded':
            case 'payment_intent.payment_failed':
            case 'payment_intent.canceled':
            case 'payment_intent.processing':
            case 'payment_intent.requires_action':
            case 'payment_intent.requires_capture': {
                const pi = event.data.object;
                const tenantId = pi.metadata?.tenantId;
                await Transaction.findByIdAndUpdate(pi.id, {
                    _id: pi.id,
                    tenantId: tenantId || 'unknown',
                    amount: pi.amount,
                    currency: pi.currency,
                    status: pi.status,
                    type: 'payment_intent',
                    metadata: pi.metadata,
                }, { upsert: true });
                break;
            }
            default:
                break;
        }
        await StripeEvent.findByIdAndUpdate(event.id, { processedAt: new Date() });
        return res.json({ received: true });
    }
    catch (error) {
        return res.status(500).json({ error: 'Webhook processing error', details: error?.message });
    }
});
//# sourceMappingURL=stripeWebhook.js.map