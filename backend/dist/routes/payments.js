import { Router } from 'express';
import { resolveTenant } from '../middlewares/tenant.js';
import { stripe, getPlatformFeeBps, computeApplicationFeeAmount, getDefaultCurrency } from '../services/stripe.js';
import { Tenant } from '../models/Tenant.js';
import { Transaction } from '../models/Transaction.js';
export const router = Router();
// Create PaymentIntent on connected account with application fee to platform
router.post('/payments/intent', resolveTenant, async (req, res, next) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Payment processing is not available. Stripe is not configured.' });
        }
        const tenantId = req.tenant.id;
        const tenant = await Tenant.findById(tenantId).lean();
        if (!tenant?.stripe?.accountId || !tenant.stripe.chargesEnabled) {
            return res.status(400).json({ error: 'Tenant is not ready to accept payments' });
        }
        const { amount, currency, description, metadata } = req.body ?? {};
        if (!amount || amount <= 0)
            return res.status(400).json({ error: 'amount required' });
        const bps = await getPlatformFeeBps();
        const fee = computeApplicationFeeAmount(amount, bps);
        const finalCurrency = currency || (await getDefaultCurrency());
        const idempotencyKey = req.header('Idempotency-Key') || undefined;
        const pi = await stripe.paymentIntents.create({
            amount,
            currency: finalCurrency,
            description,
            metadata: { ...metadata, tenantId },
            application_fee_amount: fee,
            automatic_payment_methods: { enabled: true },
        }, {
            idempotencyKey,
            stripeAccount: tenant.stripe.accountId,
        });
        await Transaction.findByIdAndUpdate(pi.id, {
            _id: pi.id,
            tenantId,
            amount: pi.amount,
            currency: pi.currency,
            applicationFeeAmount: fee,
            stripeAccountId: tenant.stripe.accountId,
            status: pi.status,
            type: 'payment_intent',
            metadata: pi.metadata,
        }, { upsert: true });
        return res.status(201).json({ data: { clientSecret: pi.client_secret, id: pi.id } });
    }
    catch (error) {
        return next(error);
    }
});
// Get payment intent status
router.get('/payments/intent/:paymentIntentId', resolveTenant, async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { paymentIntentId } = req.params;
        const transaction = await Transaction.findById(paymentIntentId).lean();
        if (!transaction || transaction.tenantId !== tenantId) {
            return res.status(404).json({ error: 'Payment intent not found' });
        }
        return res.json({ data: transaction });
    }
    catch (error) {
        return next(error);
    }
});
// List tenant's transactions
router.get('/payments/transactions', resolveTenant, async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { limit = 50, offset = 0, status } = req.query;
        const filter = { tenantId };
        if (status)
            filter.status = status;
        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(offset))
            .lean();
        const total = await Transaction.countDocuments(filter);
        return res.json({
            data: transactions,
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
                hasMore: Number(offset) + transactions.length < total
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
// Cancel payment intent
router.post('/payments/intent/:paymentIntentId/cancel', resolveTenant, async (req, res, next) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Payment processing is not available. Stripe is not configured.' });
        }
        const tenantId = req.tenant.id;
        const { paymentIntentId } = req.params;
        const transaction = await Transaction.findById(paymentIntentId).lean();
        if (!transaction || transaction.tenantId !== tenantId) {
            return res.status(404).json({ error: 'Payment intent not found' });
        }
        const tenant = await Tenant.findById(tenantId).lean();
        if (!tenant?.stripe?.accountId) {
            return res.status(400).json({ error: 'Tenant not configured for payments' });
        }
        const pi = await stripe.paymentIntents.cancel(paymentIntentId, {
            stripeAccount: tenant.stripe.accountId
        });
        // Update transaction status
        await Transaction.findByIdAndUpdate(paymentIntentId, {
            status: pi.status
        });
        return res.json({ data: { id: pi.id, status: pi.status } });
    }
    catch (error) {
        return next(error);
    }
});
// Get payment statistics for tenant
router.get('/payments/stats', resolveTenant, async (req, res, next) => {
    try {
        const tenantId = req.tenant.id;
        const { period = '30d' } = req.query;
        // Calculate date range
        const now = new Date();
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const stats = await Transaction.aggregate([
            {
                $match: {
                    tenantId,
                    createdAt: { $gte: startDate },
                    status: 'succeeded'
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalFees: { $sum: '$applicationFeeAmount' },
                    totalTransactions: { $sum: 1 },
                    averageAmount: { $avg: '$amount' }
                }
            }
        ]);
        const result = stats[0] || {
            totalAmount: 0,
            totalFees: 0,
            totalTransactions: 0,
            averageAmount: 0
        };
        return res.json({
            data: {
                period,
                totalRevenue: result.totalAmount - result.totalFees,
                totalFees: result.totalFees,
                totalTransactions: result.totalTransactions,
                averageTransaction: result.averageAmount,
                platformFeePercentage: 10
            }
        });
    }
    catch (error) {
        return next(error);
    }
});
//# sourceMappingURL=payments.js.map