import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { userValidation } from "../validations/user.validation.js";
import { validate } from "../validations/base.validation.js";

const router = Router();

router.route("/register").post(validate(userValidation.register), registerUser);

export default router;
