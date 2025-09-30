import { Schema, model } from 'mongoose';

export type TenantRole = 'admin' | 'editor' | 'viewer';

export interface MembershipDocument {
  _id: string; // composite key: `${tenantId}:${userId}` or generated id
  tenantId: string;
  userId: string;
  role: TenantRole;
  createdAt: Date;
  updatedAt: Date;
}

const membershipSchema = new Schema<MembershipDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    role: { type: String, enum: ['admin', 'editor', 'viewer'], required: true },
  },
  { timestamps: true, versionKey: false }
);

membershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export const Membership = model<MembershipDocument>('Membership', membershipSchema);


