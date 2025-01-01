import Joi from "joi";
import { PASSWORD_LENGTH } from "../constants/http.constants.js";

const register = Joi.object({
  userName: Joi.string().required(),
  email: Joi.string().email().required(),
  fullName: Joi.string().required(),
  password: Joi.string().required().min(PASSWORD_LENGTH),
});

export const userValidation = { register };
