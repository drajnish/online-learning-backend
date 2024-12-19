import mongoose from "mongoose";
import { DB_NAME } from "../constants/http.constants.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const connectionInstace = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    logger.info(
      `\nDatabase connected! DB Host: ${connectionInstace.connection.host}`
    );
  } catch (error) {
    logger.error(`MongoDB connection failed. ${error}`);
    process.exit(1);
  }
};

export default connectDB;
