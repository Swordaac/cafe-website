import { Schema, model } from 'mongoose';
const productSchema = new Schema({
    tenantId: { type: String, required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    name: { type: String, required: true },
    description: { type: String },
    priceCents: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    imageMetadata: {
        width: { type: Number },
        height: { type: Number },
        format: { type: String }
    },
    availabilityStatus: { type: String, enum: ['available', 'unavailable', 'archived'], default: 'available' },
}, { timestamps: true, versionKey: false });
productSchema.index({ tenantId: 1, name: 1 }, { unique: false });
export const Product = model('Product', productSchema);
//# sourceMappingURL=Product.js.map