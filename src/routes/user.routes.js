import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  verifyEmail,
} from "../controllers/user.controller.js";
import { userValidation } from "../validations/user.validation.js";
import { validate } from "../validations/base.validation.js";
import { addRoleToBody } from "../middleware/addRole.middleware.js";
import { UserRolesEnum } from "../constants/http.constants.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router
  .route("/register")
  .post(
    validate(userValidation.register),
    addRoleToBody(UserRolesEnum.STUDENT),
    registerUser
  );

router
  .route("/login")
  .post(
    validate(userValidation.login),
    addRoleToBody(UserRolesEnum.STUDENT),
    loginUser
  );

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/verify-email/:verificationToken").get(verifyJWT, verifyEmail);

router
  .route("/resend-email-verification")
  .post(verifyJWT, resendEmailVerification);

router.route("/refresh-token").post(refreshAccessToken);

export default router;
