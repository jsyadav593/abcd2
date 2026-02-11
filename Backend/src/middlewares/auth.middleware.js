import jwt from "jsonwebtoken";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Protect middleware - verify JWT token
export const protect = asyncHandler((req, res, next) => {
  let token;

  // Check token in header or cookies
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new apiError(401, "Access token is missing");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // decoded payload uses `id` (from token generation). Ensure both `id` and `_id` are available
    req.user = decoded || {};
    if (decoded && decoded.id) {
      req.user.id = decoded.id;
      // set `_id` for existing handlers expecting `_id`
      req.user._id = decoded.id;
    }
    next();
  } catch (err) {
    throw new apiError(401, "Invalid or expired access token");
  }
});

// Optional: Role-based authorization middleware
export const authorize = (...allowedRoles) => {
  return asyncHandler((req, res, next) => {
    if (!req.user) {
      throw new apiError(401, "User not authenticated");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new apiError(403, "Insufficient permissions");
    }

    next();
  });
};

// Optional: Check if user is active and not blocked
export const checkUserStatus = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new apiError(401, "User not authenticated");
  }

  const { User } = await import("../models/user.model.js");
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new apiError(404, "User not found");
  }

  if (user.isBlocked) {
    throw new apiError(403, "User account is blocked");
  }

  if (!user.isActive) {
    throw new apiError(403, "User account is inactive");
  }

  next();
});