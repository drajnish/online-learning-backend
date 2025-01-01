export const UserRolesEnum = {
  ADMIN: "ADMIN",
  STUDENT: "STUDENT",
  INSTRUCTOR: "INSTRUCTOR",
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
  httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
  secure: process.env.NODE_ENV === "production", // Ensures cookies are only sent over HTTPS
  // sameSite: "strict", // Restricts cookies to same-site requests (prevents CSRF attacks)
  // path: "/", // Ensures the cookie is accessible across the entire site
  // maxAge: 7 * 24 * 60 * 60 * 1000, // Sets expiration (e.g., 7 days in milliseconds)
  // domain: "example.com", // Specifies the domain where the cookie is valid
};

export const USER_TEMPORARY_TOKEN_EXPIRY = 5 * 60 * 1000;

export const PASSWORD_LENGTH = 5;
