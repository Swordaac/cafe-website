import { Schema, model } from 'mongoose';
const categorySchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    sortOrder: { type: Number },
}, { timestamps: true, versionKey: false });
categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });
categorySchema.index({ tenantId: 1, sortOrder: 1 });
export const Category = model('Category', categorySchema);
//# sourceMappingURL=Category.js.map