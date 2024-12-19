import dotenv from "dotenv";
import connectDB from "./configs/db.connect.js";
import { PORT_NUMBER } from "./constants/http.constants.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.on("error: ", (err) => {
      console.log("Error: ", err);
      throw err;
    });

    app.listen(PORT_NUMBER, () => {
      console.log(`Server is running at port ${PORT_NUMBER}`);
    });
  })
  .catch((err) => {
    console.log(`MongoDB connection failed!`, err);
  });
