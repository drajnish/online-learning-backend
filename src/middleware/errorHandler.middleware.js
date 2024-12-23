import { ApiResponse } from "../utils/ApiResponse.js";

const errorHandler = (err, _req, res, _next) => {
  const { statusCode, message } = err;

  if (!statusCode) statusCode = 500;
  if (!message) message = "Internal Server Error";

  return res
    .status(statusCode)
    .json(new ApiResponse(statusCode, null, message));
};

export default errorHandler;
