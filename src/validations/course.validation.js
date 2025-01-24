import Joi from "joi";

const createCourse = Joi.object({
  title: Joi.string().required(),
  category: Joi.string().required(),
});

export const courseValidation = { createCourse };
