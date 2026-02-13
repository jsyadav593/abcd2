import { Router } from "express";
import {
  loginUser,
  logoutUser,
  getActiveSessions,
  logoutFromAllDevices,
} from "../controllers/login.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import Joi from "joi";

const router = Router();

/**
 * Login/Logout Validation Schemas
 */
const loginSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'any.required': 'Username is required',
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),
  deviceInfo: Joi.object({
    id: Joi.string().optional(),
    name: Joi.string().optional(),
  }).optional(),
});

const logoutSchema = Joi.object({
  deviceId: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Device ID is required',
      'any.required': 'Device ID is required',
    }),
  userId: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'User ID is required',
      'any.required': 'User ID is required',
    }),
});

// ==================== Public Routes ====================

/**
 * POST /api/auth/login
 * User login with username and password
 * 
 * On successful login:
 * - Device is added to loggedInDevices
 * - isLoggedIn is set to true
 * - Return: { user, tokens, device, session }
 * 
 * Returns: { accessToken, refreshToken, device }
 */
router.post(
  "/login",
  validate(loginSchema, 'body'),
  loginUser,
);

/**
 * POST /api/auth/logout
 * Logout from a specific device
 * 
 * Logic:
 * - Mark device's last session as logged out
 * - Check if any active sessions remain
 * - If no active sessions, set isLoggedIn = false
 * - Return remaining active devices
 * 
 * Body: { deviceId, userId }
 * Returns: { loggedOutDeviceId, isLoggedIn, activeDevices }
 */
router.post(
  "/logout",
  validate(logoutSchema, 'body'),
  logoutUser,
);

/**
 * GET /api/auth/sessions/:userId
 * Get all active sessions for a user
 * 
 * Returns: { isLoggedIn, activeSessions, devices[] }
 * devices include: deviceId, ipAddress, userAgent, lastActive
 */
router.get("/sessions/:userId", getActiveSessions);

/**
 * POST /api/auth/logout-all/:userId
 * Force logout from all devices
 * 
 * Sets isLoggedIn = false
 * Marks all sessions as logged out
 * 
 * Returns: { loggedOutDevices[], isLoggedIn: false }
 */
router.post("/logout-all/:userId", logoutFromAllDevices);

export default router;
