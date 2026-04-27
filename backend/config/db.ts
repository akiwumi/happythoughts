import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/happy-thoughts";
        
        console.log("Connecting to MongoDB at:", mongoUri);
        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ Error connecting to MongoDB", error);
        console.log("💡 Make sure MongoDB is running locally or set MONGO_URI environment variable");
        throw error;
    }
};

export default connectDB;
