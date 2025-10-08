import { Schema, model } from 'mongoose';
const tenantSchema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    domain: { type: String },
    stripe: {
        accountId: { type: String },
        chargesEnabled: { type: Boolean, default: false },
        detailsSubmitted: { type: Boolean, default: false },
        payoutsEnabled: { type: Boolean, default: false },
        onboardingCompletedAt: { type: Date, default: null },
    },
}, { timestamps: true, versionKey: false });
export const Tenant = model('Tenant', tenantSchema);
//# sourceMappingURL=Tenant.js.map