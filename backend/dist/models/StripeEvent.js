import { Schema, model } from 'mongoose';
const stripeEventSchema = new Schema({
    _id: { type: String, required: true },
    type: { type: String, required: true, index: true },
    apiVersion: { type: String, default: null },
    requestId: { type: String, default: null },
    account: { type: String, default: null, index: true },
    livemode: { type: Boolean, required: true },
    processedAt: { type: Date, default: null },
    payload: { type: Object, required: true },
}, { timestamps: true, versionKey: false });
export const StripeEvent = model('StripeEvent', stripeEventSchema);
//# sourceMappingURL=StripeEvent.js.map