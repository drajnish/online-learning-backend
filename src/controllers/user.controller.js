import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  cookieOption,
  UserLoginType,
  UserRolesEnum,
} from "../constants/http.constants.js";
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail.js";
import {
  deleteFromCloudinary,
  extractPublicId,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, userName, password, fullName, role } = req.body;

  const findUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (findUser) {
    throw new ApiError(409, "User with same email or userName already exists");
  }

  const user = await User.create({
    email: email.toLowerCase(),
    userName: userName.toLowerCase(),
    password,
    fullName,
    isEmailVerified: false,
    role: role || UserRolesEnum.STUDENT,
  });

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerifyToken = hashedToken;
  user.emailVerifyExpTime = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",
    mailgenContent: emailVerificationMailgenContent(
      user.userName,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
    ),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerifyToken -emailVerifyExpTime"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "User registered successfully and verification email has been sent to your email"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;

  const findUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!findUser) {
    throw new ApiError(404, "User does not exist");
  }

  if (findUser.loginType !== UserLoginType.EMAIL_PASSWORD) {
    throw new ApiError(
      400,
      "You have previously registered using " +
        findUser.loginType?.toLowerCase() +
        ". Please use the " +
        findUser.loginType?.toLocaleLowerCase() +
        " login optioin to access your account."
    );
  }

  const verifyPassword = await findUser.isPasswordCorrect(password);

  if (!verifyPassword) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    findUser?._id
  );

  const loggedInUser = await User.findById(findUser?._id).select(
    "-password -refreshToken -emailVerifyToken -emailVerifyExpTime"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOption)
    .cookie("refreshToken", refreshToken, cookieOption)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User loggedIn successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req?.user._id,
    {
      $unset: {
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(201)
    .clearCookie("accessToken", cookieOption)
    .clearCookie("refreshToken", cookieOption)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing");
  }

  // generate a hash from the token that we are receiving
  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  const user = await User.findOne({
    emailVerifyToken: hashedToken,
    emailVerifyExpTime: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  user.emailVerifyToken = undefined;
  user.emailVerifyExpTime = undefined;
  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, { isEmailVerified: true }, "Email is verified"));
});

// This controller is called when user is logged in and he has snackbar that your email is not verified
// In case he did not get the email or the email verification token is expired
// he will be able to resend the token while he is logged in
const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req?.user._id);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // if email is already verified throw an error
  if (user.isEmailVerified) {
    throw new ApiError(409, "Email is already verified");
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerifyToken = hashedToken;
  user.emailVerifyExpTime = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Please verify your account",
    mailgenContent: emailVerificationMailgenContent(
      user.userName,
      `${req.protocol}://${req.get(
        "host"
      )}/api/v1/users/verify-email/${unHashedToken}`
    ),
  });

  return res
    .status(200)
    .json(200, {}, "An email has been sent to your mail ID");
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req?.cookies.refreshToken || req?.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user?._id);

    return res
      .status(201)
      .cookies("accessToken", accessToken, cookieOption)
      .cookies("refreshToken", newRefreshToken, cookieOption)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (err) {
    throw new ApiError(401, err?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req?.user._id);

  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }

  const verifyPassword = await user.isPasswordCorrect(oldPassword);

  if (!verifyPassword) {
    throw new ApiError(400, "Invalid password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res
    .status(201)
    .json(new ApiResponse(200, {}, "Password updated successfully"));
});

const assignRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  user.role = role;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Role changed for the user"));
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req?.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  // generate temporary token
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.passwordResetToken = hashedToken;
  user.passwordResetExpTime = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  // send mail with password reset link. It should be the link of the frontend url with token
  await sendEmail({
    email: user.email,
    subject: "Password reset request",
    mailgenContent: forgotPasswordMailgenContent(
      user.userName,
      // ! NOTE: Following link should be the link of the frontend page responsible to request password reset
      // ! Frontend will send the below token with the new password in the request body to the backend reset password endpoint
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset mail has been sent on your mail id"
      )
    );
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  // Create a hash of the incoming reset token
  let hashedToken = crypto
    .createdHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpTime: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired");
  }

  user.passwordResetToken = undefined;
  user.passwordResetExpTime = undefined;

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(201)
    .json(new ApiResponse(200, req?.user, "Current user fetched successfully"));
});

const handleSocialLogin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  return res
    .status(302)
    .cookie("accessToken", accessToken, cookieOption)
    .cookie("refreshToken", refreshToken, cookieOption)
    .redirect(
      `${process.env.CLIENT_SSO_REDIRECT_URL}?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, gender, bio, instagram, twitter, linkedin } = req.body;

  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        fullName,
        gender,
        bio,
        socialLinks: {
          instagram,
          twitter,
          linkedin,
        },
      },
    },
    {
      new: true,
    }
  ).select("-refreshToken -password -emailVerifyToken -passwordResetToken");

  if (!user) {
    throw new ApiError(401, "Unauthorized error");
  }

  return res.status(201).json(200, user, "Account detail updated successfully");
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req?.file.path;

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading avatar");
  }

  const oldAvatar = await User.findById(req?.user?._id);
  const oldAvatarPublicId = await extractPublicId(oldAvatar?.avatar);

  const user = await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    {
      new: true,
    }
  ).select("-refreshToken -password -emailVerifyToken -passwordResetToken");

  if (oldAvatarPublicId) {
    await deleteFromCloudinary(oldAvatarPublicId);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  changeCurrentPassword,
  assignRole,
  forgotPasswordRequest,
  resetForgottenPassword,
  getCurrentUser,
  handleSocialLogin,
  updateAccountDetails,
  updateUserAvatar,
};
