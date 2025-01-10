import Joi from "joi";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";

const validate =
  (schema, value = "body") =>
  (req, res, next) => {
    let error;

    try {
      if (value === "params") {
        error = schema.validate({
          ...req.params,
          ...req.body,
        });
      } else {
        error = schema.validate(req["body"]);
      }
      if (error && error.details && error.details.length > 0) {
        throw new ApiError(
          422,
          error?.details[0]?.message?.replace(new RegExp(/\"/, "g"), "")
        );
      }
      return next();
    } catch (err) {
      logger.error(err?.message);
      return next(err);
    }
  };

const validateId = (key) =>
  Joi.object({
    [key]: Joi.string().hex().length(24).required(),
  });

export { validate, validateId };
