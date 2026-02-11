// registerUser - Create login credentials for a user
// loginUser - Authenticate user with device tracking and account locking
// refreshAccessToken - Generate new access token using refresh token
// logoutUser - Logout from one or all devices
// changePassword - User changes their own password
// resetPassword - Admin resets user password
// unlockUserAccount - Unlock permanently locked accounts
// getLoginHistory - View login/logout history with pagination
// getActiveDevices - Get list of devices user is logged in on
// logoutFromDevice - Logout from specific device only
// getLoginAttempts - Check failed login attempts and lock status


import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { UserLogin } from "../models/userLogin.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt.util.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import jwt from "jsonwebtoken";

// Register/Create login credentials
const registerUser = asyncHandler(async (req, res) => {
  const { userId, username, password } = req.body || {};

  // Validation
  if (!userId || !username || !password) {
    throw new apiError(400, "UserId, username, and password are required");
  }

  if (password.length < 8) {
    throw new apiError(400, "Password must be at least 8 characters long");
  }

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  // Check if login credentials already exist
  const existingLogin = await UserLogin.findOne({ user: userId });
  if (existingLogin) {
    throw new apiError(400, "Login credentials already exist for this user");
  }

  // Check if username is already taken
  const usernameExists = await UserLogin.findOne({ username: username.toLowerCase() });
  if (usernameExists) {
    throw new apiError(400, "Username already taken");
  }

  // Create login record
  const userLogin = await UserLogin.create({
    user: userId,
    username: username.toLowerCase(),
    password,
  });

  // Update user canLogin to true
  await User.findByIdAndUpdate(userId, { canLogin: true });

  return res
    .status(201)
    .json(new apiResponse(201, userLogin, "User registered successfully"));
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
  const { username, password, deviceId, ipAddress, userAgent } = req.body || {};

  // Validation
  if (!username || !password) {
    throw new apiError(400, "Username and password are required");
  }

  // Find user login record
  const userLogin = await UserLogin.findOne({ username: username.toLowerCase() }).select(
    "+password +refreshToken"
  );

  if (!userLogin) {
    throw new apiError(401, "Invalid username or password");
  }

  // Check if user is permanently locked
  if (userLogin.isPermanentlyLocked) {
    throw new apiError(403, "Your account is permanently locked");
  }

  // Check if account is temporarily locked
  if (userLogin.lockUntil && userLogin.lockUntil > new Date()) {
    const remainingTime = Math.ceil((userLogin.lockUntil - new Date()) / 1000);
    throw new apiError(
      423,
      `Account is locked. Try again in ${remainingTime} seconds`
    );
  }

  // Get user details for canLogin check
  const user = await User.findById(userLogin.user);
  if (!user || !user.canLogin) {
    throw new apiError(403, "User is not allowed to login");
  }

  if (user.isBlocked) {
    throw new apiError(403, "User account is blocked");
  }

  // Compare password
  const isPasswordValid = await userLogin.comparePassword(password);

  if (!isPasswordValid) {
    // Increment failed login attempts
    userLogin.failedLoginAttempts += 1;

    // Apply lock based on failed attempts
    if (userLogin.failedLoginAttempts >= 5) {
      userLogin.lockLevel = Math.min(userLogin.failedLoginAttempts - 4, 4);

      if (userLogin.lockLevel === 4) {
        userLogin.isPermanentlyLocked = true;
      } else {
        const lockDurations = [60000, 180000, 300000]; // 1, 3, 5 minutes
        userLogin.lockUntil = new Date(
          Date.now() + lockDurations[userLogin.lockLevel - 1]
        );
      }
    }

    await userLogin.save();
    throw new apiError(401, "Invalid username or password");
  }

  // Reset failed login attempts on successful login
  userLogin.failedLoginAttempts = 0;
  userLogin.lockLevel = 0;
  userLogin.lockUntil = null;

  // Check device limit
  // Ensure loggedInDevices exists as an array (may be undefined on older records)
  if (!Array.isArray(userLogin.loggedInDevices)) {
    userLogin.loggedInDevices = [];
  }

  let device = userLogin.loggedInDevices.find((d) => d.deviceId === deviceId);

  if (!device && userLogin.loggedInDevices.length >= userLogin.maxAllowedDevices) {
    // Remove oldest device
    userLogin.loggedInDevices.shift();
  }

  // Update or create device
  if (device) {
    device.loginCount += 1;
    device.ipAddress = ipAddress;
    device.userAgent = userAgent;
  } else {
    device = {
      deviceId,
      ipAddress,
      userAgent,
      loginCount: 1,
      loginHistory: [],
    };
    userLogin.loggedInDevices.push(device);
  }

  // Generate tokens
  const accessToken = userLogin.generateAccessToken();
  const refreshToken = await userLogin.generateRefreshToken();

  // Update device with refresh token
  device.refreshToken = refreshToken;

  // Record login in device history
  device.loginHistory = device.loginHistory || [];
  device.loginHistory.push({
    loginAt: new Date(),
  });

  // Update login status
  userLogin.isLoggedIn = true;
  userLogin.lastLogin = new Date();

  await userLogin.save();

  // Populate user data
  const populatedUser = await UserLogin.findById(userLogin._id).populate("user");

  // Return tokens and user info (without sensitive data)
  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    .json(
      new apiResponse(
        200,
        {
          accessToken,
          refreshToken,
          user: populatedUser.user,
          deviceId,
        },
        "User logged in successfully"
      )
    );
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new apiError(401, "Refresh token is required");
  }

  try {
    const decodedToken = verifyRefreshToken(incomingRefreshToken);
    const userLogin = await UserLogin.findOne({ user: decodedToken.id }).select(
      "+refreshToken"
    );

    if (!userLogin) {
      throw new apiError(401, "Invalid refresh token");
    }

    if (userLogin.refreshToken !== incomingRefreshToken) {
      throw new apiError(401, "Refresh token expired or invalid");
    }

    const newAccessToken = userLogin.generateAccessToken();

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      })
      .json(new apiResponse(200, { accessToken: newAccessToken }, "Token refreshed"));
  } catch (error) {
    throw new apiError(401, error.message || "Invalid refresh token");
  }
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  const { deviceId } = req.body || {};
  const userId = req.user._id; // Assuming authenticated user is in req.user

  const userLogin = await UserLogin.findOne({ user: userId });

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  if (deviceId) {
    // Logout from specific device
    const device = userLogin.loggedInDevices.find((d) => d.deviceId === deviceId);
    if (device) {
      const currentLogin = device.loginHistory[device.loginHistory.length - 1];
      if (currentLogin && !currentLogin.logoutAt) {
        currentLogin.logoutAt = new Date();
      }
    }
  } else {
    // Logout from all devices
    userLogin.loggedInDevices.forEach((device) => {
      const currentLogin = device.loginHistory[device.loginHistory.length - 1];
      if (currentLogin && !currentLogin.logoutAt) {
        currentLogin.logoutAt = new Date();
      }
    });
  }

  // Check if all devices are logged out
  const allLoggedOut = userLogin.loggedInDevices.every((device) => {
    const lastLogin = device.loginHistory[device.loginHistory.length - 1];
    return lastLogin && lastLogin.logoutAt;
  });

  if (allLoggedOut) {
    userLogin.isLoggedIn = false;
  }

  userLogin.refreshToken = null;
  await userLogin.save();

  return res
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json(new apiResponse(200, {}, "User logged out successfully"));
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body || {};
  const userId = req.user._id;

  // Validation
  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new apiError(400, "All password fields are required");
  }

  if (newPassword !== confirmPassword) {
    throw new apiError(400, "New passwords do not match");
  }

  if (newPassword.length < 8) {
    throw new apiError(400, "New password must be at least 8 characters long");
  }

  if (oldPassword === newPassword) {
    throw new apiError(400, "New password must be different from old password");
  }

  const userLogin = await UserLogin.findOne({ user: userId }).select("+password");

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  // Verify old password
  const isPasswordValid = await userLogin.comparePassword(oldPassword);

  if (!isPasswordValid) {
    throw new apiError(401, "Old password is incorrect");
  }

  // Update password
  userLogin.password = newPassword;
  await userLogin.save();

  return res.status(200).json(new apiResponse(200, {}, "Password changed successfully"));
});

// Reset password (admin/user request)
const resetPassword = asyncHandler(async (req, res) => {
  const { userId, newPassword } = req.body || {};

  // Validation
  if (!userId || !newPassword) {
    throw new apiError(400, "UserId and new password are required");
  }

  if (newPassword.length < 8) {
    throw new apiError(400, "Password must be at least 8 characters long");
  }

  const userLogin = await UserLogin.findOne({ user: userId });

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  // Reset password
  userLogin.password = newPassword;
  userLogin.failedLoginAttempts = 0;
  userLogin.lockLevel = 0;
  userLogin.lockUntil = null;
  userLogin.isPermanentlyLocked = false;

  await userLogin.save();

  return res.status(200).json(new apiResponse(200, {}, "Password reset successfully"));
});

// Unlock user account
const unlockUserAccount = asyncHandler(async (req, res) => {
  const { userId } = req.body || {};

  if (!userId) {
    throw new apiError(400, "UserId is required");
  }

  const userLogin = await UserLogin.findOne({ user: userId });

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  // Unlock account
  userLogin.failedLoginAttempts = 0;
  userLogin.lockLevel = 0;
  userLogin.lockUntil = null;
  userLogin.isPermanentlyLocked = false;

  await userLogin.save();

  return res.status(200).json(new apiResponse(200, userLogin, "User account unlocked"));
});

// Get login history
const getLoginHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { deviceId, page = 1, limit = 10 } = req.query;

  if (!userId) {
    throw new apiError(400, "UserId is required");
  }

  const userLogin = await UserLogin.findOne({ user: userId });

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  let devices = userLogin.loggedInDevices;

  if (deviceId) {
    devices = devices.filter((d) => d.deviceId === deviceId);
  }

  // Flatten login history from all devices
  const allLoginHistory = [];
  devices.forEach((device) => {
    device.loginHistory.forEach((login) => {
      allLoginHistory.push({
        deviceId: device.deviceId,
        ipAddress: device.ipAddress,
        userAgent: device.userAgent,
        loginAt: login.loginAt,
        logoutAt: login.logoutAt,
      });
    });
  });

  // Sort by loginAt descending
  allLoginHistory.sort((a, b) => b.loginAt - a.loginAt);

  // Pagination
  const skip = (page - 1) * limit;
  const paginatedHistory = allLoginHistory.slice(skip, skip + parseInt(limit));

  return res.status(200).json(
    new apiResponse(200, {
      loginHistory: paginatedHistory,
      pagination: {
        total: allLoginHistory.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(allLoginHistory.length / limit),
      },
    })
  );
});

// Get active devices
const getActiveDevices = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "UserId is required");
  }

  const userLogin = await UserLogin.findOne({ user: userId });

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  const activeDevices = userLogin.loggedInDevices.map((device) => {
    const lastLogin = device.loginHistory[device.loginHistory.length - 1];
    return {
      deviceId: device.deviceId,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      loginCount: device.loginCount,
      lastLoginAt: lastLogin?.loginAt,
      isActive: lastLogin && !lastLogin.logoutAt,
    };
  });

  return res
    .status(200)
    .json(new apiResponse(200, activeDevices, "Active devices fetched successfully"));
});

// Logout from specific device
const logoutFromDevice = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { deviceId } = req.body;

  if (!userId || !deviceId) {
    throw new apiError(400, "UserId and deviceId are required");
  }

  const userLogin = await UserLogin.findOne({ user: userId });

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  const device = userLogin.loggedInDevices.find((d) => d.deviceId === deviceId);

  if (!device) {
    throw new apiError(404, "Device not found");
  }

  // Mark last login as logged out
  const currentLogin = device.loginHistory[device.loginHistory.length - 1];
  if (currentLogin && !currentLogin.logoutAt) {
    currentLogin.logoutAt = new Date();
  }

  await userLogin.save();

  return res.status(200).json(new apiResponse(200, {}, "Logged out from device"));
});

// Get login attempts
const getLoginAttempts = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new apiError(400, "UserId is required");
  }

  const userLogin = await UserLogin.findOne({ user: userId }).select(
    "+failedLoginAttempts +lockLevel +lockUntil +isPermanentlyLocked"
  );

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  return res.status(200).json(
    new apiResponse(
      200,
      {
        failedLoginAttempts: userLogin.failedLoginAttempts,
        lockLevel: userLogin.lockLevel,
        lockUntil: userLogin.lockUntil,
        isPermanentlyLocked: userLogin.isPermanentlyLocked,
      },
      "Login attempts fetched"
    )
  );
});

export {
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
};