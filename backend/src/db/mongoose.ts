import mongoose from 'mongoose';
import { env } from '../config/env.js';

let isConnected = false;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (isConnected) return mongoose;
  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri, {
    // @ts-expect-error modern mongoose has proper typings
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = true;
  return mongoose;
}


