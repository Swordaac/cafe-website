import mongoose from 'mongoose';
import { env } from '../config/env.js';
let isConnected = false;
// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose connected to MongoDB Atlas');
});
mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});
mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB Atlas');
    isConnected = false;
});
// Handle application termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🔌 Mongoose connection closed through app termination');
    process.exit(0);
});
export async function connectToDatabase() {
    if (isConnected)
        return mongoose;
    mongoose.set('strictQuery', true);
    // Debug: Log connection details (without password)
    const uri = env.mongoUri;
    const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('🔍 Attempting to connect to MongoDB:', maskedUri);
    try {
        // Try with admin auth source first
        await mongoose.connect(env.mongoUri, {
            serverSelectionTimeoutMS: 10000, // Increased timeout for production
            socketTimeoutMS: 45000, // Socket timeout
            bufferCommands: false, // Disable mongoose buffering
            maxPoolSize: 10, // Maintain up to 10 socket connections
            minPoolSize: 5, // Maintain a minimum of 5 socket connections
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            retryWrites: true, // Retry write operations
            w: 'majority', // Write concern
            authSource: 'admin', // Use admin database for authentication
        });
        console.log('✅ Connected to MongoDB Atlas');
        isConnected = true;
        return mongoose;
    }
    catch (error) {
        console.error('❌ MongoDB connection error with admin auth:', error);
        // Try fallback without explicit authSource
        try {
            console.log('🔄 Trying fallback connection without authSource...');
            await mongoose.connect(env.mongoUri, {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                bufferCommands: false,
                maxPoolSize: 10,
                minPoolSize: 5,
                maxIdleTimeMS: 30000,
                retryWrites: true,
                w: 'majority',
            });
            console.log('✅ Connected to MongoDB Atlas (fallback)');
            isConnected = true;
            return mongoose;
        }
        catch (fallbackError) {
            console.error('❌ MongoDB fallback connection also failed:', fallbackError);
            throw error; // Throw original error
        }
    }
}
//# sourceMappingURL=mongoose.js.map