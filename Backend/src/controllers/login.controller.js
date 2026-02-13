import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";
import { User } from "../models/user.model.js";
import { UserLogin } from "../models/userLogin.model.js";
import { Audit, createAuditLog } from "../models/audit.model.js";
import { v4 as uuidv4 } from "uuid";

/**
 * User Login Controller
 * Handles user authentication and device tracking
 * 
 * When login succeeds:
 * 1. Check if device already exists
 * 2. If new device, add to loggedInDevices
 * 3. If existing device, update session
 * 4. Set isLoggedIn = true (has at least one active device)
 * 5. Generate access & refresh tokens
 * 6. Return device info and tokens
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { username, password, deviceInfo } = req.body;

  if (!username || !username.trim()) {
    throw new apiError(400, "Username is required");
  }

  if (!password || !password.trim()) {
    throw new apiError(400, "Password is required");
  }

  // Find UserLogin by username (case-insensitive)
  const userLogin = await UserLogin.findOne({ username: username.toLowerCase() })
    .select('+password');

  if (!userLogin) {
    logger.warn('Login attempt with non-existent username', {
      username,
      ipAddress: req.ip,
    });
    throw new apiError(401, "Invalid username or password");
  }

  // Get user details
  const user = await User.findById(userLogin.user);

  if (!user || !user.canLogin) {
    logger.warn('Login attempt for user with canLogin disabled', {
      userId: user?._id,
      username,
      ipAddress: req.ip,
    });
    throw new apiError(401, "Your account is not eligible for login");
  }

  if (user.isBlocked) {
    logger.warn('Login attempt for blocked user', {
      userId: user._id,
      username,
      ipAddress: req.ip,
    });
    throw new apiError(401, "Your account has been blocked");
  }

  // TODO: Uncomment when you implement password comparison
  // For now, login validation is disabled
  // const isPasswordValid = await userLogin.comparePassword(password);
  // if (!isPasswordValid) {
  //   throw new apiError(401, "Invalid username or password");
  // }

  // Get or create device ID
  let deviceId = deviceInfo?.id || uuidv4();

  // Check if device already logged in
  let existingDevice = userLogin.loggedInDevices.find(d => d.deviceId === deviceId);

  if (existingDevice) {
    // Device already logged in - reinitialize session
    existingDevice.loginCount = (existingDevice.loginCount || 0) + 1;
    existingDevice.ipAddress = req.ip;
    existingDevice.userAgent = req.get('user-agent');
    
    // Add new login history entry
    existingDevice.loginHistory.push({
      loginAt: new Date(),
      logoutAt: null,
    });
  } else {
    // New device - add to loggedInDevices array
    userLogin.loggedInDevices.push({
      deviceId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      loginCount: 1,
      refreshToken: null,
      loginHistory: [
        {
          loginAt: new Date(),
          logoutAt: null,
        },
      ],
    });
  }

  // Set isLoggedIn to true (has at least one active device)
  userLogin.isLoggedIn = true;
  userLogin.lastLogin = new Date();

  // Generate tokens
  const accessToken = userLogin.generateAccessToken();
  const refreshToken = await userLogin.generateRefreshToken();

  // Update refresh token for this device
  const deviceToUpdate = userLogin.loggedInDevices.find(d => d.deviceId === deviceId);
  if (deviceToUpdate) {
    deviceToUpdate.refreshToken = refreshToken;
  }

  // Save UserLogin
  await userLogin.save();

  // Log audit trail
  await createAuditLog({
    userId: user._id,
    action: 'USER_LOGIN',
    resourceType: 'UserLogin',
    resourceId: userLogin._id,
    organizationId: user.organizationId,
    changes: {
      deviceId,
      deviceCount: userLogin.loggedInDevices.length,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    status: 'success',
    metadata: {
      endpoint: req.originalUrl,
      method: req.method,
    },
  });

  logger.info('User login successful', {
    userId: user._id,
    username: userLogin.username,
    deviceId,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new apiResponse(
      200,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
        device: {
          deviceId,
          loginCount: existingDevice?.loginCount || 1,
        },
        session: {
          isLoggedIn: true,
          totalDevices: userLogin.loggedInDevices.length,
        },
      },
      "Login successful",
    ),
  );
});

/**
 * User Logout Controller
 * Logout from a specific device
 * 
 * Logic:
 * 1. Find device by deviceId
 * 2. Mark last login session as logged out (logoutAt)
 * 3. Check if any active sessions remain (login without logoutAt)
 * 4. If no active sessions, set isLoggedIn = false
 * 5. Return remaining active devices
 */
export const logoutUser = asyncHandler(async (req, res) => {
  const { deviceId, userId } = req.body;

  if (!deviceId || !deviceId.trim()) {
    throw new apiError(400, "Device ID is required");
  }

  if (!userId || !userId.trim()) {
    throw new apiError(400, "User ID is required");
  }

  // Find UserLogin
  const userLogin = await UserLogin.findOne({ user: userId });

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  // Find device
  const device = userLogin.loggedInDevices.find(d => d.deviceId === deviceId);

  if (!device) {
    logger.warn('Logout attempt for non-existent device', {
      userId,
      deviceId,
      ipAddress: req.ip,
    });

    return res.status(200).json(
      new apiResponse(
        200,
        {
          loggedOutDeviceId: deviceId,
          isLoggedIn: userLogin.isLoggedIn,
          message: "Device was already logged out",
          activeDevices: userLogin.loggedInDevices
            .filter(d => d.loginHistory.some(h => !h.logoutAt))
            .map(d => ({
              deviceId: d.deviceId,
              ipAddress: d.ipAddress,
              lastActive: d.loginHistory[d.loginHistory.length - 1]?.loginAt,
            })),
        },
        "Device already logged out",
      ),
    );
  }

  // Mark the last login session as logged out
  if (device.loginHistory && device.loginHistory.length > 0) {
    const lastSession = device.loginHistory[device.loginHistory.length - 1];
    if (!lastSession.logoutAt) {
      lastSession.logoutAt = new Date();
    }
  }

  // Check if there are any active sessions remaining
  // A session is active if it has no logoutAt
  const hasActiveSessions = userLogin.loggedInDevices.some(d =>
    d.loginHistory.some(h => !h.logoutAt),
  );

  // If no active sessions remain, set isLoggedIn to false
  if (!hasActiveSessions) {
    userLogin.isLoggedIn = false;
  }

  // Clear refresh token for this device
  device.refreshToken = null;

  // Save UserLogin
  await userLogin.save();

  // Get remaining active devices
  const activeDevices = userLogin.loggedInDevices
    .filter(d => d.loginHistory.some(h => !h.logoutAt))
    .map(d => ({
      deviceId: d.deviceId,
      ipAddress: d.ipAddress,
      userAgent: d.userAgent,
      loginCount: d.loginCount,
      lastActive: d.loginHistory[d.loginHistory.length - 1]?.loginAt,
    }));

  // Log audit trail
  const user = await User.findById(userLogin.user);
  await createAuditLog({
    userId: user._id,
    action: 'USER_LOGOUT',
    resourceType: 'UserLogin',
    resourceId: userLogin._id,
    organizationId: user.organizationId,
    changes: {
      deviceId,
      remainingDevices: activeDevices.length,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    status: 'success',
    metadata: {
      endpoint: req.originalUrl,
      method: req.method,
    },
  });

  logger.info('User logout successful', {
    userId: user._id,
    username: userLogin.username,
    deviceId,
    remainingActiveDevices: activeDevices.length,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new apiResponse(
      200,
      {
        loggedOutDeviceId: deviceId,
        isLoggedIn: userLogin.isLoggedIn,
        message: userLogin.isLoggedIn
          ? `You are still logged in on ${activeDevices.length} device(s)`
          : 'You have been logged out from all devices',
        activeDevices: activeDevices,
      },
      "Logout successful",
    ),
  );
});

/**
 * Get Active Sessions for a user
 * Returns list of all devices user is currently logged in on
 */
export const getActiveSessions = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const userLogin = await UserLogin.findOne({ user: userId });

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  // Get active devices (sessions with no logoutAt)
  const activeDevices = userLogin.loggedInDevices
    .map(d => ({
      deviceId: d.deviceId,
      ipAddress: d.ipAddress,
      userAgent: d.userAgent,
      loginCount: d.loginCount,
      lastActive: d.loginHistory
        .filter(h => !h.logoutAt)
        .map(h => h.loginAt)
        .pop() || d.loginHistory[d.loginHistory.length - 1]?.loginAt,
      isActive: d.loginHistory.some(h => !h.logoutAt),
    }))
    .filter(d => d.isActive);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        userId,
        isLoggedIn: userLogin.isLoggedIn,
        totalSessions: userLogin.loggedInDevices.length,
        activeSessions: activeDevices.length,
        devices: activeDevices,
      },
      "Active sessions retrieved",
    ),
  );
});

/**
 * Logout From All Devices
 * Force logout from all devices
 * Sets isLoggedIn = false
 */
export const logoutFromAllDevices = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const userLogin = await UserLogin.findOne({ user: userId });

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  const loggedOutDevices = [];

  // Mark all login sessions as logged out
  userLogin.loggedInDevices.forEach(device => {
    device.loginHistory.forEach(session => {
      if (!session.logoutAt) {
        session.logoutAt = new Date();
        loggedOutDevices.push(device.deviceId);
      }
    });
    device.refreshToken = null;
  });

  // Set isLoggedIn to false
  userLogin.isLoggedIn = false;

  await userLogin.save();

  // Log audit trail
  const user = await User.findById(userLogin.user);
  await createAuditLog({
    userId: user._id,
    action: 'USER_LOGOUT_ALL_DEVICES',
    resourceType: 'UserLogin',
    resourceId: userLogin._id,
    organizationId: user.organizationId,
    changes: {
      loggedOutDevices: loggedOutDevices,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    status: 'success',
    metadata: {
      endpoint: req.originalUrl,
      method: req.method,
    },
  });

  logger.info('User logged out from all devices', {
    userId: user._id,
    username: userLogin.username,
    deviceCount: loggedOutDevices.length,
    ipAddress: req.ip,
  });

  return res.status(200).json(
    new apiResponse(
      200,
      {
        loggedOutDevices,
        isLoggedIn: false,
        message: `Logged out from ${loggedOutDevices.length} device(s)`,
      },
      "Logged out from all devices successfully",
    ),
  );
});
