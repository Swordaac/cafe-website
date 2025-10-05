import { Schema, model } from 'mongoose';
const tenantSchema = new Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    domain: { type: String },
}, { timestamps: true, versionKey: false });
export const Tenant = model('Tenant', tenantSchema);
//# sourceMappingURL=Tenant.js.map