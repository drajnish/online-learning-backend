import Joi from "joi";
import {
  AvailableUserRoles,
  PASSWORD_LENGTH,
} from "../constants/http.constants.js";

const register = Joi.object({
  userName: Joi.string().required(),
  email: Joi.string().email().required(),
  fullName: Joi.string().required(),
  password: Joi.string().required().min(PASSWORD_LENGTH),
});

const login = Joi.object({
  userName: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().required(),
}).xor("userName", "email");

const changePwd = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().required().min(PASSWORD_LENGTH),
});

const assignRole = Joi.object({
  params: Joi.object({
    userId: Joi.string().required(),
  }),
  body: Joi.object({
    role: Joi.string()
      .valid(...AvailableUserRoles)
      .required(),
  }),
});

const forgotPwd = Joi.object({
  email: Joi.string().required().email(),
});

const forgotPwdReset = Joi.object({
  params: Joi.object({
    resetToken: Joi.string()
      .length(40)
      .regex(/^[a-fA-F0-9]+$/)
      .required(),
  }),
  body: Joi.object({
    newPassword: Joi.string().required().min(PASSWORD_LENGTH),
  }),
});

export const userValidation = {
  register,
  login,
  changePwd,
  assignRole,
  forgotPwd,
  forgotPwdReset,
};
