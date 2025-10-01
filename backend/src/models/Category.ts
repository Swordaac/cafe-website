import { Schema, model, Types } from 'mongoose';

export interface CategoryDocument {
  _id: Types.ObjectId;
  tenantId: string;
  name: string;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    sortOrder: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

export const Category = model<CategoryDocument>('Category', categorySchema);


