import { Schema, model } from 'mongoose';

export interface TenantDocument {
  _id: string; // tenant id slug
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<TenantDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

export const Tenant = model<TenantDocument>('Tenant', tenantSchema);


