import { Schema, model } from 'mongoose';

export interface StripeEventDocument {
  _id: string; // stripe event id
  type: string;
  apiVersion?: string | null;
  requestId?: string | null;
  account?: string | null; // connected account for connect events
  livemode: boolean;
  processedAt: Date | null; // when we processed the event
  payload: any; // raw event data for replay/debugging
  createdAt: Date;
  updatedAt: Date;
}

const stripeEventSchema = new Schema<StripeEventDocument>(
  {
    _id: { type: String, required: true },
    type: { type: String, required: true, index: true },
    apiVersion: { type: String, default: null },
    requestId: { type: String, default: null },
    account: { type: String, default: null, index: true },
    livemode: { type: Boolean, required: true },
    processedAt: { type: Date, default: null },
    payload: { type: Object, required: true },
  },
  { timestamps: true, versionKey: false }
);

export const StripeEvent = model<StripeEventDocument>('StripeEvent', stripeEventSchema);


