import { Schema, model } from 'mongoose';
const loyaltySchema = new Schema({
    userId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    purchaseCount: { type: Number, required: true, default: 0, min: 0 },
    points: { type: Number, required: true, default: 0, min: 0 },
    freeProductEligible: { type: Boolean, required: true, default: false },
    lastRedemptionPurchaseCount: { type: Number, required: true, default: 0, min: 0 },
    lastPurchaseDate: { type: Date },
    enrolledAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true, versionKey: false });
// Compound index for efficient queries
loyaltySchema.index({ userId: 1, tenantId: 1 }, { unique: true });
loyaltySchema.index({ tenantId: 1, purchaseCount: -1 });
export const Loyalty = model('Loyalty', loyaltySchema);
//# sourceMappingURL=Loyalty.js.map