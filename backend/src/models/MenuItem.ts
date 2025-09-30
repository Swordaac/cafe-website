import { Schema, model, Types } from 'mongoose';

export interface MenuItemDocument {
  _id: Types.ObjectId;
  tenantId: string;
  name: string;
  description?: string;
  priceCents: number;
  category?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<MenuItemDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    priceCents: { type: Number, required: true, min: 0 },
    category: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true, versionKey: false }
);

menuItemSchema.index({ tenantId: 1, name: 1 }, { unique: false });

export const MenuItem = model<MenuItemDocument>('MenuItem', menuItemSchema);


