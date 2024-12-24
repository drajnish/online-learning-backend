export const UserRolesEnum = {
  ADMIN: "ADMIN",
  USER: "USER",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

export const UserLoginType = {
  GOOGLE: "GOOGLE",
  GITHUB: "GITHUB",
  EMAIL_PASSWORD: "EMAIL_PASSWORD",
};

export const AvailableSocialLogins = Object.values(UserLoginType);

export const DB_NAME = "online-learning";
export const PORT_NUMBER = process.env.PORT || 4000;

export const cookieOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export const USER_TEMPORARY_TOKEN_EXPIRY = 5 * 60 * 1000;
