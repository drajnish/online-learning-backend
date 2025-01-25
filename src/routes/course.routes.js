import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  createCourse,
  deleteCourse,
  getAllCourses,
  togglePublishCourse,
  updateCourse,
} from "../controllers/course.controller.js";
import { validate } from "../validations/base.validation.js";
import { courseValidation } from "../validations/course.validation.js";

const router = Router();

router
  .route("/create-course")
  .post(validate(courseValidation.createCourse), verifyJWT, createCourse);

router.route("/update-course/:courseId").patch(verifyJWT, updateCourse);

router.route("/delete-course/:courseId").delete(verifyJWT, deleteCourse);

router
  .route("/toggle/publish-course/:courseId")
  .patch(verifyJWT, togglePublishCourse);

router.route("/").get(verifyJWT, getAllCourses);

export default router;
