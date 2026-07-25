import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_CONNECTIONSTRING;

    if (!mongoUri) {
      throw new Error('MONGODB_CONNECTIONSTRING is not defined in .env');
    }

    await mongoose.connect(mongoUri);

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};