import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addModule,
  deleteModule,
  getAllModules,
  updateModule,
} from "../controllers/module.controller.js";

const router = Router();

router.route("/add-module/:courseId").post(verifyJWT, addModule);

router
  .route("/:courseId/update-module/:moduleId")
  .patch(verifyJWT, updateModule);

router.route("/delete-module").post(verifyJWT, deleteModule);

router.route("/get-module").get(verifyJWT, getAllModules);

export default router;
