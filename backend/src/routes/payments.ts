import { Router } from 'express';
import { authSupabase } from '../middlewares/authSupabase.js';
import { resolveTenant } from '../middlewares/tenant.js';
import { stripe, getPlatformFeeBps, computeApplicationFeeAmount, getDefaultCurrency } from '../services/stripe.js';
import { Tenant } from '../models/Tenant.js';
import { Transaction } from '../models/Transaction.js';
import { Product } from '../models/Product.js';
import { ensureTenantExists } from '../middlewares/membership.js';
import { resolveTenantStrict } from '../middlewares/tenantStrict.js';

export const router = Router();

// Create PaymentIntent on connected account with application fee to platform
// Public creation (customer-side): resolve tenant and ensure it exists
router.post('/payments/intent', resolveTenant, ensureTenantExists, async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment processing is not available. Stripe is not configured.' });
    }

    const tenantId = req.tenant!.id;
    const tenant = await Tenant.findById(tenantId).lean();
    if (!tenant?.stripe?.accountId || !tenant.stripe.chargesEnabled) {
      return res.status(400).json({ error: 'Tenant is not ready to accept payments' });
    }

    const { items, currency, description, metadata } = req.body ?? {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required and must not be empty' });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.productId || !item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ error: 'Each item must have productId and positive quantity' });
      }
    }

    // Load products and compute canonical amount
    const productIds = items.map((item: any) => String(item.productId));
    const products = await Product.find({ _id: { $in: productIds }, tenantId }).lean();
    
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => String(p._id));
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      return res.status(400).json({ 
        error: 'Some products not found or not available for this tenant',
        missingProducts: missingIds
      });
    }

    const productMap = new Map(products.map(p => [String(p._id), p]));
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = productMap.get(String(item.productId));
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      
      if (product.availabilityStatus !== 'available') {
        return res.status(400).json({ error: `Product ${product.name} is not available` });
      }

      const itemTotal = product.priceCents * item.quantity;
      totalAmount += itemTotal;
      
      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceCents: product.priceCents,
        name: product.name
      });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid total amount' });
    }

    const bps = await getPlatformFeeBps();
    const fee = computeApplicationFeeAmount(totalAmount, bps);
    const finalCurrency = (currency as string) || (await getDefaultCurrency());

    const idempotencyKey = req.header('Idempotency-Key') || undefined;

    let pi;
    try {
      pi = await stripe.paymentIntents.create(
        {
          amount: totalAmount,
          currency: finalCurrency,
          description: description || `Order for ${items.length} item(s) from ${tenantId}`,
          metadata: { 
            ...metadata, 
            tenantId,
            items: JSON.stringify(items.map(item => ({ productId: item.productId, quantity: item.quantity }))), // Store only essential item data
            totalItems: items.length.toString()
          },
          application_fee_amount: fee,
          automatic_payment_methods: { enabled: true },
        },
        {
          idempotencyKey,
          stripeAccount: tenant.stripe.accountId,
        }
      );
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      return res.status(400).json({ 
        error: 'Payment processing failed',
        details: stripeError?.message || 'Unknown Stripe error'
      });
    }

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

    return res.status(201).json({ 
      data: { 
        clientSecret: pi.client_secret, 
        id: pi.id,
        stripeAccountId: tenant.stripe.accountId
      } 
    });
  } catch (error) {
    return next(error);
  }
});

// Get payment intent status
router.get('/payments/intent/:paymentIntentId', resolveTenant, ensureTenantExists, async (req, res, next) => {
  try {
    const tenantId = req.tenant!.id;
    const { paymentIntentId } = req.params;
    
    const transaction = await Transaction.findById(paymentIntentId).lean();
    if (!transaction || transaction.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Payment intent not found' });
    }
    
    return res.json({ data: transaction });
  } catch (error) {
    return next(error);
  }
});

// List tenant's transactions
router.get('/payments/transactions', resolveTenant, async (req, res, next) => {
  try {
    const tenantId = req.tenant!.id;
    const { limit = 50, offset = 0, status } = req.query;
    
    const filter: any = { tenantId };
    if (status) filter.status = status;
    
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
  } catch (error) {
    return next(error);
  }
});

// Cancel payment intent
// Protected cancel (staff): require auth + strict tenant
router.post('/payments/intent/:paymentIntentId/cancel', authSupabase, resolveTenantStrict, ensureTenantExists, async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Payment processing is not available. Stripe is not configured.' });
    }

    const tenantId = req.tenant!.id;
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
      status: pi.status as any 
    });
    
    return res.json({ data: { id: pi.id, status: pi.status } });
  } catch (error) {
    return next(error);
  }
});

// Get payment statistics for tenant
router.get('/payments/stats', resolveTenant, async (req, res, next) => {
  try {
    const tenantId = req.tenant!.id;
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
  } catch (error) {
    return next(error);
  }
});


