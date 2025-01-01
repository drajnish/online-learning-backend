import Joi from "joi";
import { ApiError } from "../utils/ApiError.js";
import logger from "../utils/logger.js";

const validate =
  (schema, value = "body") =>
  (req, res, next) => {
    try {
      const { error } = schema.validate(req[value]);
      if (error) {
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
