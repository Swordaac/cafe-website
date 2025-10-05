import { Schema, model } from 'mongoose';
const menuItemSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    priceCents: { type: Number, required: true, min: 0 },
    category: { type: String },
    imageUrl: { type: String },
}, { timestamps: true, versionKey: false });
menuItemSchema.index({ tenantId: 1, name: 1 }, { unique: false });
export const MenuItem = model('MenuItem', menuItemSchema);
//# sourceMappingURL=MenuItem.js.map