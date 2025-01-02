import { ApiResponse } from "../utils/ApiResponse.js";

const errorHandler = (err, _req, res, _next) => {
  // const { statusCode, message } = err;

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // if (!statusCode) statusCode = 500;
  // if (!message) message = "Internal Server Error";

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, null, message));
};

export default errorHandler;
