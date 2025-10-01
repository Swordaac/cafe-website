import { Schema, model, Types } from 'mongoose';

export type AvailabilityStatus = 'available' | 'unavailable' | 'archived';

export interface ProductDocument {
  _id: Types.ObjectId;
  tenantId: string;
  categoryId?: Types.ObjectId;
  name: string;
  description?: string;
  priceCents: number;
  imageUrl?: string;
  availabilityStatus: AvailabilityStatus;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    name: { type: String, required: true },
    description: { type: String },
    priceCents: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    availabilityStatus: { type: String, enum: ['available', 'unavailable', 'archived'], default: 'available' },
  },
  { timestamps: true, versionKey: false }
);

productSchema.index({ tenantId: 1, name: 1 }, { unique: false });

export const Product = model<ProductDocument>('Product', productSchema);


