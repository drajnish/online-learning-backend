import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import passport from "passport";
import errorHandler from "./middleware/errorHandler.middleware.js";
import logger from "./utils/logger.js";
import { connectPassport } from "./utils/passport.js";
import { ApiError } from "./utils/ApiError.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(passport.initialize());
connectPassport();

// configure morgan
const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

// Routes import
import userRouter from "./routes/user.routes.js";
import courseRouter from "./routes/course.routes.js";
import moduleRouter from "./routes/module.routes.js";

// Routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/modules", moduleRouter);

// Handle undefined routes
app.all("*", (req, _res, next) => {
  return next(
    new ApiError(404, `Cannot find ${req.originalUrl} on this server!`)
  );
});

// Error handling middleware
app.use(errorHandler);

export { app };
