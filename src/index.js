import dotenv from "dotenv";
import logger from "./utils/logger.js";
import connectDB from "./configs/db.connect.js";
import { PORT_NUMBER } from "./constants/http.constants.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(PORT_NUMBER, () => {
      logger.info(`Server is running at port ${PORT_NUMBER}`);
    });
  })
  .catch((err) => {
    logger.error("MongoDB connection failed!", err);
  });
