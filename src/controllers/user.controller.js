import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { cookieOption } from "../constants/http.constants.js";
import jwt from "jsonwebtoken";

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
    role,
  });

  if (findUser) {
    throw new ApiError(409, "User with same email or userName already exists");
  }

  const user = await User.create({
    email: email.toLowerCase(),
    userName: userName.toLowerCase(),
    password,
    fullName,
    role,
  });

  const createdUser = await User.findById(user._id).select(
    "_id role userName email"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    createdUser?._id
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOption)
    .cookie("refreshToken", refreshToken, cookieOption)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { userName, email, password, role } = req.body;

  const findUser = await User.findOne({
    $or: [{ userName }, { email }],
    role,
  });

  if (!findUser) {
    throw new ApiError(404, "User not found");
  }

  const verifyPassword = await findUser.isPasswordCorrect(password);

  if (!verifyPassword) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    findUser?._id
  );

  const loggedInUser = await User.findById(findUser?._id).select(
    "userName email fullName role"
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOption)
    .cookie("refreshToken", refreshToken, cookieOption)
    .json(new ApiResponse(200, loggedInUser, "User loggedIn successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req?.user._id,
    {
      $unset: {
        refreshToken: 1,
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

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(201)
    .json(new ApiResponse(200, req?.user, "Current user fetched successfully"));
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

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
};
