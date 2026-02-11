// models/userLogin.model.js
import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const userLoginSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    refreshToken: { type: String, select: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockLevel: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    isPermanentlyLocked: { type: Boolean, default: false },
    isLoggedIn: { type: Boolean, default: false },
    lastLogin: { type: Date },
    loggedInDevices: [
      {
        deviceId: { type: String, default: () => uuidv4() },
        ipAddress: String,
        userAgent: String,
        loginCount: { type: Number, default: 0 },
        refreshToken: String,
        loginHistory: [
          {
            loginAt: { type: Date, default: Date.now },
            logoutAt: Date,
          },
        ],
      },
    ],
    maxAllowedDevices: { type: Number, default: 2 },
  },
  { timestamps: true }
);

// Password Hash - Modern mongoose async pre-hook (no next param)
userLoginSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
});

// Password Compare
userLoginSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

// Token Generators
userLoginSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this.user,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET || "ACCESS_TOKEN_DEFAULT",
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "15m" }
  );
};

userLoginSchema.methods.generateRefreshToken = async function () {
  const token = jwt.sign(
    { id: this.user },
    process.env.REFRESH_TOKEN_SECRET || "REFRESH_TOKEN_DEFAULT",
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d",
    }
  );
  this.refreshToken = token;
  await this.save();
  return token;
};

export const UserLogin = mongoose.model("UserLogin", userLoginSchema);