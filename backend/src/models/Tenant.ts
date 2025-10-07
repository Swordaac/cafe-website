import { Schema, model } from 'mongoose';

export interface TenantDocument {
  _id: string; // tenant id slug
  name: string;
  domain?: string;
  stripe?: {
    accountId?: string; // Connected account id
    chargesEnabled?: boolean;
    detailsSubmitted?: boolean;
    payoutsEnabled?: boolean;
    onboardingCompletedAt?: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<TenantDocument>(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    domain: { type: String },
    stripe: {
      accountId: { type: String },
      chargesEnabled: { type: Boolean, default: false },
      detailsSubmitted: { type: Boolean, default: false },
      payoutsEnabled: { type: Boolean, default: false },
      onboardingCompletedAt: { type: Date, default: null },
    },
  },
  { timestamps: true, versionKey: false }
);

export const Tenant = model<TenantDocument>('Tenant', tenantSchema);




