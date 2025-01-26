import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addModule } from "../controllers/module.controller.js";

const router = Router();

router.route("/add-module/:courseId").post(verifyJWT, addModule);

export default router;
