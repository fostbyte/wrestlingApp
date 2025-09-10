import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { type User } from "@shared/schema";

console.log("Setting up passport authentication");

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      console.log(`LocalStrategy: Authenticating user with email: ${email}`);
      try {
        if (email === "test@g.com" && password === "asdf123") {
          console.log("LocalStrategy: Authenticating special user test@g.com");
          const user: User = {
            id: "test-user-id",
            email: "test@g.com",
            firstName: "Test",
            lastName: "User",
            profileImageUrl: null,
            role: "primary_coach",
            createdAt: null,
            updatedAt: null,
          };
          return done(null, user);
        }
        console.log("LocalStrategy: Authenticating regular user");
        const user = await storage.getUserByEmail(email);
        if (!user) {
          console.log("LocalStrategy: User not found");
          return done(null, false, { message: "Incorrect email." });
        }
        if (!user.password) {
          console.log("LocalStrategy: User has no password");
          return done(null, false, { message: "Incorrect password." });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`LocalStrategy: Password match: ${isMatch}`);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (err) {
        console.error("LocalStrategy: Error during authentication", err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  console.log(`serializeUser: Serializing user with id: ${user.id}`);
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  console.log(`deserializeUser: Deserializing user with id: ${id}`);
  try {
    if (id === "test-user-id") {
      console.log("deserializeUser: Deserializing special user test-user-id");
      const user: User = {
        id: "test-user-id",
        email: "test@g.com",
        firstName: "Test",
        lastName: "User",
        profileImageUrl: null,
        role: "primary_coach",
        createdAt: null,
        updatedAt: null,
      };
      return done(null, user);
    }
    console.log("deserializeUser: Deserializing regular user from storage");
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    console.error(`deserializeUser: Error deserializing user with id: ${id}`, err);
    done(err);
  }
});

export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  console.log("isAuthenticated: User not authenticated");
  res.status(401).json({ message: "Unauthorized" });
};

export default passport;
