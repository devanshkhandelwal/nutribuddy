import mongoose from "mongoose";

const connectDB = async () => {
  console.log("connecting to MongoDB");
  try {
    await mongoose.connect(process.env.DATABASE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (err) {
    console.log("Failed to connect to MongoDB", err);
  }
};

export default connectDB;
