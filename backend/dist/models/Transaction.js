import { Schema, model } from 'mongoose';
const transactionSchema = new Schema({
    _id: { type: String, required: true },
    tenantId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    applicationFeeAmount: { type: Number },
    stripeAccountId: { type: String },
    status: { type: String, required: true },
    type: { type: String, required: true },
    metadata: { type: Object },
}, { timestamps: true, versionKey: false });
// Query helpers
transactionSchema.index({ tenantId: 1, createdAt: -1 });
transactionSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
export const Transaction = model('Transaction', transactionSchema);
//# sourceMappingURL=Transaction.js.map