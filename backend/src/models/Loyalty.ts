import { Schema, model, Types } from 'mongoose';

export interface LoyaltyDocument {
  _id: Types.ObjectId;
  userId: string; // Supabase user ID
  tenantId: string;
  purchaseCount: number; // Total number of purchases
  points: number; // Current points (can be used for future features)
  freeProductEligible: boolean; // Whether user has earned a free product (every 7 purchases)
  lastPurchaseDate?: Date;
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const loyaltySchema = new Schema<LoyaltyDocument>(
  {
    userId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    purchaseCount: { type: Number, required: true, default: 0, min: 0 },
    points: { type: Number, required: true, default: 0, min: 0 },
    freeProductEligible: { type: Boolean, required: true, default: false },
    lastPurchaseDate: { type: Date },
    enrolledAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, versionKey: false }
);

// Compound index for efficient queries
loyaltySchema.index({ userId: 1, tenantId: 1 }, { unique: true });
loyaltySchema.index({ tenantId: 1, purchaseCount: -1 });

export const Loyalty = model<LoyaltyDocument>('Loyalty', loyaltySchema);

