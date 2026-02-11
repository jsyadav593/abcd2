// Authentication Routes
// Routes for user login, logout, register, token refresh, and session management

import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changePassword,
  resetPassword,
  unlockUserAccount,
  getLoginHistory,
  getActiveDevices,
  logoutFromDevice,
  getLoginAttempts,
} from "../controllers/userLogin.controller.js";
import { protect, checkUserStatus } from "../middlewares/auth.middleware.js";

const router = Router();

// ==================== Public Routes ====================

//! Register user with login credentials
// POST /api/auth/register
// Body: { userId, username, password }
router.post("/register", registerUser);

//! Login user
// POST /api/auth/login
// Body: { username, password, deviceId, ipAddress, userAgent }
// Response: Sets httpOnly cookies (accessToken, refreshToken)
router.post("/login", loginUser);

//! Refresh access token
// POST /api/auth/refresh-token
// Cookies: refreshToken (auto-sent by browser)
// OR Body: { refreshToken }
router.post("/refresh-token", refreshAccessToken);

// ==================== Protected Routes (Authenticated Users) ====================

//! Logout user
// POST /api/auth/logout
// Body: { deviceId } - optional, if not provided logs out from all devices
// Cookies: Clears accessToken and refreshToken
router.post("/logout", protect, logoutUser);

//! Change user's own password
// POST /api/auth/change-password
// Body: { oldPassword, newPassword, confirmPassword }
router.post("/change-password", protect, changePassword);

//! Get login history for current user
// GET /api/auth/login-history/:userId
// Query: { deviceId, page=1, limit=10 }
router.get("/login-history/:userId", protect, getLoginHistory);

//! Get active devices for current user
// GET /api/auth/active-devices/:userId
router.get("/active-devices/:userId", protect, getActiveDevices);

//! Logout from specific device
// POST /api/auth/logout-device/:userId
// Body: { deviceId }
router.post("/logout-device/:userId", protect, logoutFromDevice);

//! Get login attempts and lock status
// GET /api/auth/login-attempts/:userId
router.get("/login-attempts/:userId", protect, getLoginAttempts);

// ==================== Admin Only Routes ====================

//! Reset user password (admin function)
// POST /api/auth/reset-password
// Body: { userId, newPassword }
// Note: Add authorization middleware for admin only
router.post("/reset-password", protect, resetPassword);

//! Unlock user account (admin function)
// POST /api/auth/unlock-account
// Body: { userId }
// Note: Add authorization middleware for admin only
router.post("/unlock-account", protect, unlockUserAccount);

export default router;
