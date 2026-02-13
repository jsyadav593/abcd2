import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";
import { User } from "../models/user.model.js";
import { UserLogin } from "../models/userLogin.model.js";
import { PasswordReset } from "../models/passwordReset.model.js";
import { Audit, createAuditLog } from "../models/audit.model.js";
import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import crypto from "crypto";

/**
 * Request password reset via username or email
 * Steps:
 * 1. Find UserLogin by username or User by email
 * 2. Check if user exists and canLogin is enabled
 * 3. Generate reset token
 * 4. Save to DB with 1-hour expiry
 * 5. Return token (only once) - user should save it
 * 6. Audit log the request
 */
export const requestPasswordReset = asyncHandler(async (req, res) => {
  const { username } = req.body;

  if (!username || !username.trim()) {
    throw new apiError(400, "Username is required");
  }

  // Find UserLogin by username (case-insensitive)
  let userLogin = await UserLogin.findOne({ username: username.toLowerCase() });

  if (!userLogin) {
    // Don't expose that username doesn't exist (security best practice)
    // Log the attempt for security
    logger.warn("Password reset attempt for non-existent username", {
      username,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Return generic response
    return res.status(200).json(
      new apiResponse(
        200,
        {},
        "If the username exists, a password reset link will be sent shortly",
      ),
    );
  }

  // Check if user exists and canLogin is true
  const user = await User.findById(userLogin.user);

  if (!user || !user.canLogin) {
    logger.warn("Password reset attempt for user with canLogin false", {
      userId: user?._id,
      username,
      ipAddress: req.ip,
    });

    return res.status(200).json(
      new apiResponse(
        200,
        {},
        "If the username exists, a password reset link will be sent shortly",
      ),
    );
  }

  // Invalidate any existing unused tokens for this user
  await PasswordReset.updateMany(
    { user: user._id, isUsed: false },
    { isUsed: true, usedAt: new Date() },
  );

  // Generate reset token
  const { plainToken, hashedToken } = PasswordReset.generateToken();

  // Calculate expiry (1 hour from now)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Create password reset record
  const resetRecord = await PasswordReset.create({
    user: user._id,
    userLogin: userLogin._id,
    token: hashedToken,
    expiresAt,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    reason: "user_request",
  });

  // Log audit trail
  await createAuditLog({
    userId: user._id,
    action: 'PASSWORD_RESET_REQUESTED',
    resourceType: 'UserLogin',
    resourceId: userLogin._id,
    organizationId: user.organizationId,
    changes: { resetId: resetRecord._id.toString() },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    status: 'success',
    metadata: {
      endpoint: req.originalUrl,
      method: req.method,
    },
  });

  logger.info('Password reset requested', {
    userId: user._id,
    username: userLogin.username,
    ipAddress: req.ip,
  });

  // Return reset token (shown only once to user)
  return res.status(200).json(
    new apiResponse(
      200,
      {
        resetToken: plainToken,
        expiresIn: '1 hour',
        message: 'Password reset token generated. This token is only shown once. Keep it safe.',
      },
      "Password reset token sent. Please use it within 1 hour.",
    ),
  );
});

/**
 * Verify if reset token is valid
 * Checks:
 * 1. Token exists and is not used
 * 2. Token hasn't expired
 * 3. User still exists and canLogin is enabled
 */
export const verifyResetToken = asyncHandler(async (req, res) => {
  const { resetToken } = req.body;

  if (!resetToken || !resetToken.trim()) {
    throw new apiError(400, "Reset token is required");
  }

  // Hash the provided token to find it in DB
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Find the reset record
  const resetRecord = await PasswordReset.findOne({
    token: hashedToken,
    isUsed: false,
  });

  if (!resetRecord) {
    throw new apiError(400, "Invalid or expired reset token");
  }

  // Check expiry
  if (new Date() > resetRecord.expiresAt) {
    throw new apiError(400, "Reset token has expired. Request a new one.");
  }

  // Verify user still exists and canLogin
  const user = await User.findById(resetRecord.user);
  const userLogin = await UserLogin.findById(resetRecord.userLogin);

  if (!user || !userLogin || !user.canLogin) {
    throw new apiError(400, "User account is no longer eligible for password reset");
  }

  return res.status(200).json(
    new apiResponse(
      200,
      {
        valid: true,
        username: userLogin.username,
        expiresAt: resetRecord.expiresAt,
      },
      "Reset token is valid",
    ),
  );
});

/**
 * Reset password using valid reset token
 * Steps:
 * 1. Verify token is valid
 * 2. Hash new password
 * 3. Update UserLogin password
 * 4. Mark token as used
 * 5. Log audit trail
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;

  // Validate inputs
  if (!resetToken || !resetToken.trim()) {
    throw new apiError(400, "Reset token is required");
  }

  if (!newPassword || !newPassword.trim()) {
    throw new apiError(400, "New password is required");
  }

  if (newPassword !== confirmPassword) {
    throw new apiError(400, "Passwords do not match");
  }

  // Minimum password length check
  if (newPassword.length < 8) {
    throw new apiError(400, "Password must be at least 8 characters long");
  }

  // Hash the provided token
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Find the reset record
  const resetRecord = await PasswordReset.findOne({
    token: hashedToken,
    isUsed: false,
  });

  if (!resetRecord) {
    throw new apiError(400, "Invalid or expired reset token");
  }

  // Check expiry
  if (new Date() > resetRecord.expiresAt) {
    throw new apiError(400, "Reset token has expired");
  }

  // Find UserLogin and User
  const userLogin = await UserLogin.findById(resetRecord.userLogin);
  const user = await User.findById(resetRecord.user);

  if (!userLogin || !user) {
    throw new apiError(404, "User not found");
  }

  // Hash new password (bcrypt will hash it on save via pre-hook)
  userLogin.password = newPassword;
  
  try {
    await userLogin.save();
  } catch (error) {
    logger.error('Password reset failed during save', {
      userId: user._id,
      error: error.message,
    });
    throw new apiError(500, "Failed to reset password");
  }

  // Mark token as used
  await resetRecord.markAsUsed();

  // Invalidate all other unused reset tokens for this user
  await PasswordReset.updateMany(
    { user: user._id, _id: { $ne: resetRecord._id }, isUsed: false },
    { isUsed: true, usedAt: new Date() },
  );

  // Log audit trail
  await createAuditLog({
    userId: user._id,
    action: 'PASSWORD_RESET_COMPLETED',
    resourceType: 'UserLogin',
    resourceId: userLogin._id,
    organizationId: user.organizationId,
    changes: { resetId: resetRecord._id.toString() },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    status: 'success',
    metadata: {
      endpoint: req.originalUrl,
      method: req.method,
    },
  });

  logger.info('Password reset completed', {
    userId: user._id,
    username: userLogin.username,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new apiResponse(
      200,
      { username: userLogin.username },
      "Password reset successfully. You can now login with your new password.",
    ),
  );
});

/**
 * Admin-initiated password reset (force reset)
 * Creates a new temporary password and sends it to admin
 * Called by admin when user forgets password and cannot request reset
 */
export const adminResetPassword = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  // Find user
  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  // Find UserLogin
  const userLogin = await UserLogin.findOne({ user: userId });
  if (!userLogin) {
    throw new apiError(400, "User has no login credentials");
  }

  // Generate a random temporary password
  const tempPassword = crypto.randomBytes(8).toString('hex').slice(0, 12);
  
  // Update password
  userLogin.password = tempPassword;
  await userLogin.save();

  // Log audit trail
  await createAuditLog({
    userId: req.user?._id || null,
    action: 'ADMIN_RESET_PASSWORD',
    resourceType: 'UserLogin',
    resourceId: userLogin._id,
    organizationId: user.organizationId,
    changes: { username: userLogin.username },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    status: 'success',
    metadata: {
      endpoint: req.originalUrl,
      method: req.method,
      adminId: req.user?._id,
    },
  });

  logger.info('Admin reset password', {
    adminId: req.user?._id,
    userId: user._id,
    username: userLogin.username,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new apiResponse(
      200,
      {
        username: userLogin.username,
        tempPassword: tempPassword,
        message: 'Temporary password generated. Share with user securely.',
      },
      "Password reset by admin",
    ),
  );
});

/**
 * Check password reset status for a user
 * Returns if there are any pending (unused) reset tokens
 */
export const getPasswordResetStatus = asyncHandler(async (req, res) => {
  const { username } = req.query;

  if (!username || !username.trim()) {
    throw new apiError(400, "Username is required");
  }

  const userLogin = await UserLogin.findOne({ username: username.toLowerCase() });

  if (!userLogin) {
    return res.status(200).json(
      new apiResponse(
        200,
        { hasPendingReset: false },
        "No pending reset found",
      ),
    );
  }

  // Check for pending (unused) reset tokens
  const pendingReset = await PasswordReset.findOne({
    user: userLogin.user,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  return res.status(200).json(
    new apiResponse(
      200,
      {
        hasPendingReset: !!pendingReset,
        expiresAt: pendingReset?.expiresAt || null,
      },
      "Reset status retrieved",
    ),
  );
});
