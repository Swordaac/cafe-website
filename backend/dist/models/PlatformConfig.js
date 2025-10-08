import { Schema, model } from 'mongoose';
const platformConfigSchema = new Schema({
    _id: { type: String, required: true, default: 'platform' },
    stripe: {
        applicationFeeBps: { type: Number, required: true },
        defaultCurrency: { type: String, required: true },
    },
}, { timestamps: true, versionKey: false });
export const PlatformConfig = model('PlatformConfig', platformConfigSchema);
//# sourceMappingURL=PlatformConfig.js.map