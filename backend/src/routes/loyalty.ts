import { Router } from 'express';
import { authSupabase } from '../middlewares/authSupabase.js';
import { resolveTenant } from '../middlewares/tenant.js';
import { resolveTenantStrict } from '../middlewares/tenantStrict.js';
import { ensureTenantExists } from '../middlewares/membership.js';
import { auditLog } from '../middlewares/auditLog.js';
import { createTenantRateLimiter } from '../middlewares/rateLimit.js';
import { Loyalty } from '../models/Loyalty.js';

export const router = Router();
const tenantRateLimiter = createTenantRateLimiter();

const PURCHASES_FOR_FREE_PRODUCT = 7;

// Enroll in loyalty program
router.post(
  '/loyalty/enroll',
  authSupabase,
  resolveTenant,
  auditLog,
  tenantRateLimiter,
  ensureTenantExists,
  async (req, res, next) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const tenantId = req.tenant!.id;

      // Check if already enrolled
      const existing = await Loyalty.findOne({ userId, tenantId });
      if (existing) {
        return res.status(200).json({
          data: {
            enrolled: true,
            purchaseCount: existing.purchaseCount,
            freeProductEligible: existing.freeProductEligible,
            message: 'Already enrolled in loyalty program',
          },
        });
      }

      // Create new loyalty record
      const loyalty = await Loyalty.create({
        userId,
        tenantId,
        purchaseCount: 0,
        points: 0,
        freeProductEligible: false,
        enrolledAt: new Date(),
      });

      return res.status(201).json({
        data: {
          enrolled: true,
          purchaseCount: loyalty.purchaseCount,
          freeProductEligible: loyalty.freeProductEligible,
          message: 'Successfully enrolled in loyalty program',
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Get loyalty status
router.get(
  '/loyalty/status',
  authSupabase,
  resolveTenant,
  auditLog,
  tenantRateLimiter,
  ensureTenantExists,
  async (req, res, next) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const tenantId = req.tenant!.id;

      const loyalty = await Loyalty.findOne({ userId, tenantId });
      if (!loyalty) {
        return res.status(200).json({
          data: {
            enrolled: false,
            purchaseCount: 0,
            freeProductEligible: false,
            purchasesUntilFree: PURCHASES_FOR_FREE_PRODUCT,
          },
        });
      }

      const purchasesUntilFree = loyalty.freeProductEligible
        ? 0
        : PURCHASES_FOR_FREE_PRODUCT - (loyalty.purchaseCount % PURCHASES_FOR_FREE_PRODUCT);

      return res.status(200).json({
        data: {
          enrolled: true,
          purchaseCount: loyalty.purchaseCount,
          freeProductEligible: loyalty.freeProductEligible,
          purchasesUntilFree,
          points: loyalty.points,
          lastPurchaseDate: loyalty.lastPurchaseDate,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Redeem free product (resets eligibility)
router.post(
  '/loyalty/redeem',
  authSupabase,
  resolveTenantStrict,
  auditLog,
  tenantRateLimiter,
  ensureTenantExists,
  async (req, res, next) => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const tenantId = req.tenant!.id;

      const loyalty = await Loyalty.findOne({ userId, tenantId });
      if (!loyalty) {
        return res.status(400).json({ error: 'Not enrolled in loyalty program' });
      }

      if (!loyalty.freeProductEligible) {
        const purchasesUntilFree = PURCHASES_FOR_FREE_PRODUCT - (loyalty.purchaseCount % PURCHASES_FOR_FREE_PRODUCT);
        return res.status(400).json({
          error: 'Free product not yet eligible',
          purchasesUntilFree,
        });
      }

      // Reset eligibility
      loyalty.freeProductEligible = false;
      await loyalty.save();

      return res.status(200).json({
        data: {
          redeemed: true,
          purchaseCount: loyalty.purchaseCount,
          freeProductEligible: loyalty.freeProductEligible,
          purchasesUntilFree: PURCHASES_FOR_FREE_PRODUCT - (loyalty.purchaseCount % PURCHASES_FOR_FREE_PRODUCT),
          message: 'Free product redeemed successfully',
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Increment purchase count (called from webhook)
export async function incrementLoyaltyPurchase(userId: string, tenantId: string): Promise<void> {
  try {
    const loyalty = await Loyalty.findOne({ userId, tenantId });
    if (!loyalty) {
      // User not enrolled, skip
      return;
    }

    loyalty.purchaseCount += 1;
    loyalty.lastPurchaseDate = new Date();

    // Check if user has reached the threshold for free product
    if (loyalty.purchaseCount % PURCHASES_FOR_FREE_PRODUCT === 0) {
      loyalty.freeProductEligible = true;
    }

    await loyalty.save();
  } catch (error) {
    console.error('Error incrementing loyalty purchase:', error);
    // Don't throw - we don't want to fail the webhook if loyalty update fails
  }
}

