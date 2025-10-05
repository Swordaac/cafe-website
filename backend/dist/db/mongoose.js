import mongoose from 'mongoose';
import { env } from '../config/env.js';
let isConnected = false;
export async function connectToDatabase() {
    if (isConnected)
        return mongoose;
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    return mongoose;
}
//# sourceMappingURL=mongoose.js.map