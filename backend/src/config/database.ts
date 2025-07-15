import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://elkiwebdesign:0mrazzWaXrloYGdZ@cluster0.g0enka0.mongodb.net/realestate?retryWrites=true&w=majority';

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;

