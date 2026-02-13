import { Router } from "express";
import {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  adminResetPassword,
  getPasswordResetStatus,
} from "../controllers/password.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import Joi from "joi";

const router = Router();

/**
 * Password Reset Validation Schemas
 */
const requestResetSchema = Joi.object({
  username: Joi.string()
    .trim()
    .min(3)
    .required()
    .messages({
      'string.empty': 'Username is required',
      'any.required': 'Username is required',
    }),
});

const verifyTokenSchema = Joi.object({
  resetToken: Joi.string()
    .trim()
    .length(64) // 32 bytes hex = 64 chars
    .required()
    .messages({
      'string.length': 'Invalid reset token format',
      'any.required': 'Reset token is required',
    }),
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string()
    .trim()
    .length(64)
    .required()
    .messages({
      'string.length': 'Invalid reset token format',
      'any.required': 'Reset token is required',
    }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'New password is required',
    }),
  confirmPassword: Joi.string()
    .trim()
    .required()
    .messages({
      'any.required': 'Password confirmation is required',
    }),
});

// ==================== Public Routes (No Auth Required) ====================

/**
 * POST /api/password/request-reset
 * Request password reset token via username
 * Returns: { resetToken, expiresIn }
 */
router.post(
  "/request-reset",
  validate(requestResetSchema, 'body'),
  requestPasswordReset
);

/**
 * POST /api/password/verify-token
 * Verify if reset token is valid
 * Returns: { valid, username, expiresAt }
 */
router.post(
  "/verify-token",
  validate(verifyTokenSchema, 'body'),
  verifyResetToken
);

/**
 * POST /api/password/reset
 * Reset password using valid token
 * Body: { resetToken, newPassword, confirmPassword }
 * Returns: { username }
 */
router.post(
  "/reset",
  validate(resetPasswordSchema, 'body'),
  resetPassword
);

/**
 * GET /api/password/status
 * Check password reset status for a user
 * Query: ?username=xxx
 * Returns: { hasPendingReset, expiresAt }
 */
router.get("/status", getPasswordResetStatus);

// ==================== Admin Routes (Auth Required - When Ready) ====================

/**
 * POST /api/password/admin-reset/:userId
 * Admin-initiated password reset (force reset)
 * Returns: { username, tempPassword, message }
 * Note: Enable auth.middleware.js when login is implemented
 */
router.post("/:userId/admin-reset", adminResetPassword);

export default router;
