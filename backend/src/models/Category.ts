import { Schema, model, Types } from 'mongoose';

export interface CategoryDocument {
  _id: Types.ObjectId;
  tenantId: string;
  name: string;
  sortOrder?: number;
  imageUrl?: string;
  imagePublicId?: string;
  imageMetadata?: {
    width: number;
    height: number;
    format: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    sortOrder: { type: Number },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    imageMetadata: {
      width: { type: Number },
      height: { type: Number },
      format: { type: String }
    },
  },
  { timestamps: true, versionKey: false }
);

categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });
categorySchema.index({ tenantId: 1, sortOrder: 1 });

export const Category = model<CategoryDocument>('Category', categorySchema);


