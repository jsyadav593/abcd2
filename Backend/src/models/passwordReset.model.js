import mongoose from "mongoose";
import crypto from "crypto";

const passwordResetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userLogin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserLogin",
      required: true,
    },
    // Hashed token for security (never store plain tokens in DB)
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Plain token returned to user (only during creation, not stored)
    plainToken: {
      type: String,
      select: false,
    },
    // Expiry time for reset token (default 1 hour)
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Auto-delete after expiry
    },
    // Track if token has been used
    isUsed: {
      type: Boolean,
      default: false,
    },
    // When was it used (for audit trail)
    usedAt: {
      type: Date,
      default: null,
    },
    // IP address that requested the reset
    ipAddress: String,
    userAgent: String,
    // Reason/context for tracking
    reason: {
      type: String,
      enum: ["user_request", "admin_forced_reset"],
      default: "user_request",
    },
  },
  { timestamps: true }
);

// Static method to generate reset token
passwordResetSchema.statics.generateToken = function () {
  // Generate 32-byte random token and convert to hex
  const plainToken = crypto.randomBytes(32).toString("hex");
  // Hash token for storage
  const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
  return { plainToken, hashedToken };
};

// Instance method to verify and compare tokens
passwordResetSchema.methods.verifyToken = function (plainToken) {
  const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
  return this.token === hashedToken && !this.isUsed && new Date() < this.expiresAt;
};

// Instance method to mark token as used
passwordResetSchema.methods.markAsUsed = async function () {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

export const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);
