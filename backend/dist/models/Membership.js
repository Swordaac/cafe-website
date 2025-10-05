import { Schema, model } from 'mongoose';
const membershipSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ['admin', 'editor', 'viewer'], required: true },
}, { timestamps: true, versionKey: false });
membershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
export const Membership = model('Membership', membershipSchema);
//# sourceMappingURL=Membership.js.map