import mongoose from "mongoose";

// Environment variables for MongoDB connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/paybit";

// Options for mongoose connection
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true,
} as mongoose.ConnectOptions;

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log("MongoDB connected successfully");
  } catch (error) {
    
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

export default connectDB;
