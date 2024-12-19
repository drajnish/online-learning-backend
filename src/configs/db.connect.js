import mongoose from "mongoose";
import { DB_NAME } from "../constants/http.constants.js";

const connectDB = async () => {
  try {
    const connectionInstace = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\nDatabase connected! DB Host: ${connectionInstace.connection.host}`
    );
  } catch (error) {
    console.log(`MongoDB connection failed. ${error}`);
    process.exit(1);
  }
};

export default connectDB;
