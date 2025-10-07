import { Schema, model } from 'mongoose';

export interface TransactionDocument {
  _id: string; // payment_intent id or charge id
  tenantId: string;
  amount: number; // in smallest currency unit
  currency: string;
  applicationFeeAmount?: number;
  stripeAccountId?: string; // connected account
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled' | 'requires_capture' | 'failed';
  type: 'payment_intent' | 'charge' | 'refund' | 'transfer';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
  {
    _id: { type: String, required: true },
    tenantId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    applicationFeeAmount: { type: Number },
    stripeAccountId: { type: String },
    status: { type: String, required: true },
    type: { type: String, required: true },
    metadata: { type: Object },
  },
  { timestamps: true, versionKey: false }
);

export const Transaction = model<TransactionDocument>('Transaction', transactionSchema);


