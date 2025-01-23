import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GithubStrategy } from "passport-github2";
import { User } from "../models/user.model.js";
import { UserLoginType } from "../constants/http.constants.js";

export const connectPassport = () => {
  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async function (_accessToken, _refreshToken, profile, next) {
        try {
          // Check if user already exists
          let user = await User.findOne({
            googleId: profile.id,
          });

          if (!user) {
            // find user by email
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              // Link google id to existing user
              user.googleId = profile.id;
              user.loginType = UserLoginType.GOOGLE;
              await user.save();
            } else {
              // Create a new user
              user = await User.create({
                googleId: profile.id,
                fullName: profile.displayName,
                email: profile.emails[0].value,
                avatar: profile.photos[0].value,
                userName: profile.username,
                loginType: UserLoginType.GOOGLE,
              });
            }
          }

          return next(null, user);
        } catch (error) {
          return next(error, false);
        }
      }
    )
  );

  // Github Strategy
  passport.use(
    new GithubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL,
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, next) => {
        try {
          let user = await User.findOne({
            githubId: profile.id,
          });

          if (!user) {
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
              user.githubId = profile.id;
              user.loginType = UserLoginType.GITHUB;
              await user.save();
            } else {
              user = await User.create({
                githubId: profile.id,
                fullName: profile.displayName,
                email: profile.emails[0].value,
                avatar: profile.photos[0].value,
                userName: profile.username,
                loginType: UserLoginType.GITHUB,
              });
            }
          }

          console.log("github Strategy: ", user);

          return next(null, user);
        } catch (error) {
          return next(error, false);
        }
      }
    )
  );

  passport.serializeUser((user, next) => {
    next(null, user.id);
  });

  passport.deserializeUser(async (id, next) => {
    const user = await User.findById(id);
    next(null, user);
  });
};
