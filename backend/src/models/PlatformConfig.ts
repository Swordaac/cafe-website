import { Schema, model } from 'mongoose';

export interface PlatformConfigDocument {
  _id: string; // singleton id: 'platform'
  stripe: {
    applicationFeeBps: number; // basis points (e.g., 500 = 5%)
    defaultCurrency: string; // e.g., usd
  };
  createdAt: Date;
  updatedAt: Date;
}

const platformConfigSchema = new Schema<PlatformConfigDocument>(
  {
    _id: { type: String, required: true, default: 'platform' },
    stripe: {
      applicationFeeBps: { type: Number, required: true },
      defaultCurrency: { type: String, required: true },
    },
  },
  { timestamps: true, versionKey: false }
);

export const PlatformConfig = model<PlatformConfigDocument>('PlatformConfig', platformConfigSchema);


