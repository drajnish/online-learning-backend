import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  createCourse,
  updateCourse,
} from "../controllers/course.controller.js";
import { validate } from "../validations/base.validation.js";
import { courseValidation } from "../validations/course.validation.js";

const router = Router();

router
  .route("/create-course")
  .post(validate(courseValidation.createCourse), verifyJWT, createCourse);

router.route("/update-course/:courseId").patch(verifyJWT, updateCourse);

export default router;
