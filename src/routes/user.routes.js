import { Router } from "express";
import {
  assignRole,
  changeCurrentPassword,
  forgotPasswordRequest,
  getCurrentUser,
  githubLogin,
  googleLogin,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendEmailVerification,
  resetForgottenPassword,
  updateAccountDetails,
  updateUserAvatar,
  verifyEmail,
} from "../controllers/user.controller.js";
import { userValidation } from "../validations/user.validation.js";
import { validate } from "../validations/base.validation.js";
import { addRoleToBody } from "../middleware/addRole.middleware.js";
import { UserRolesEnum } from "../constants/http.constants.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";
import passport from "passport";

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

router
  .route("/change-password")
  .post(validate(userValidation.changePwd), verifyJWT, changeCurrentPassword);

// For admin
router
  .route("/assign-role/:userId")
  .post(validate(userValidation.assignRole, "params"), verifyJWT, assignRole);

router
  .route("/forgot-password")
  .get(validate(userValidation.forgotPwd), forgotPasswordRequest);

router
  .route("/forgot-password/:resetToken")
  .post(
    validate(userValidation.forgotPwdReset, "params"),
    resetForgottenPassword
  );

router.route("/user-detail").get(verifyJWT, getCurrentUser);

router.route("/profile-update").patch(verifyJWT, updateAccountDetails);

router
  .route("/update-avatar")
  .post(verifyJWT, upload.single("avatar"), updateUserAvatar)
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

router
  .route("/google-login")
  .get(passport.authenticate("google", { scope: ["profile", "email"] }));

router
  .route("/google/callback")
  .get(passport.authenticate("google", { session: false }), googleLogin);

router
  .route("/github-login")
  .get(passport.authenticate("github", { scope: ["user:email"] }));

router
  .route("/github/callback")
  .get(passport.authenticate("github", { session: false }), githubLogin);

export default router;
