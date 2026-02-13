import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";
import { User } from "../models/user.model.js";
import { UserLogin } from "../models/userLogin.model.js";
import { Audit, createAuditLog } from "../models/audit.model.js";
import mongoose from "mongoose";

// Helper function to log audit trail
async function logAudit(req, action, resourceId, changes = {}, status = 'success', errorMessage = null) {
  try {
    await createAuditLog({
      userId: req.user?._id || null,
      action,
      resourceType: 'User',
      resourceId,
      organizationId: req.body.organizationId || req.query.organizationId,
      changes,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status,
      errorMessage,
      metadata: {
        endpoint: req.originalUrl,
        method: req.method,
      },
    });
  } catch (error) {
    logger.error('Audit logging failed', { error: error.message });
    // Don't throw - audit failure shouldn't break main operation
  }
}

// Create a new user
const createUser = asyncHandler(async (req, res) => {
  const {
    userId,
    name,
    designation,
    department,
    email,
    role,
    phone_no,
    canLogin,
    permissions,
    reportingTo,
    organizationId,
    branchId,
    isActive,
    isBlocked,
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ userId, organizationId });
  if (existingUser) {
    throw new apiError(400, "User with this ID already exists");
  }

  // Create user
  const user = await User.create({
    userId,
    name,
    designation: designation || "NA",
    department: department || "NA",
    email,
    phone_no : phone_no || null,
    role: role || "user",
    canLogin: canLogin || false,
    permissions: permissions || [],
    reportingTo: reportingTo || null,
    organizationId,
    branchId: branchId || [],
    isActive: isActive !== undefined ? isActive : true,
    isBlocked: isBlocked !== undefined ? isBlocked : false,
    createdBy: req.user?._id,
  });

  // Log audit trail
  await logAudit(req, 'USER_CREATED', user._id, { after: user.toObject() });

  logger.info('User created', { userId: user._id, userName: user.name, organizationId });

  return res
    .status(201)
    .json(new apiResponse(201, user, "User created successfully"));
});

// Get all users
const getAllUsers = asyncHandler(async (req, res) => {
  const { organizationId, role, isActive } = req.query;
  const { page = 1, limit = 10 } = req.sanitizedQuery || {};

  const filter = {};

  if (organizationId && organizationId.trim()) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new apiError(400, "Invalid organizationId");
    }
    filter.organizationId = organizationId;
  }

  if (role && role.trim()) {
    filter.role = role;
  }

  if (isActive !== undefined && isActive.trim && isActive.trim()) {
    filter.isActive = isActive === "true";
  }

  const skip = (page - 1) * limit;

  try {
    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .select("-password")
      .lean();

    const totalUsers = await User.countDocuments(filter);

    return res.status(200).json(
      new apiResponse(200, {
        users,
        pagination: {
          total: totalUsers,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalUsers / limit),
        },
      }),
    );
  } catch (error) {
    console.error("getAllUsers error:", error);
    throw error;
  }
});

// Get user by ID
const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId)
    .populate("reportingTo", "name email role")
    .populate("organizationId", "name")
    .populate("branchId", "name")
    .populate("createdBy", "name email");

  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res.status(200).json(new apiResponse(200, user, "User fetched successfully"));
});

// Update user
const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  // Validation for role
  if (
    updateData.role &&
    !["enterprise_admin", "super_admin", "admin", "user"].includes(updateData.role)
  ) {
    throw new apiError(400, "Invalid role provided");
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("reportingTo", "name email role")
    .populate("organizationId", "name")
    .populate("branchId", "name")
    .populate("createdBy", "name email");

  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res.status(200).json(new apiResponse(200, user, "User updated successfully"));
});

// Inactive user (soft delete - mark as inactive)
const inActiveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true },
  );

  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res.status(200).json(new apiResponse(200, user, "User deleted successfully"));
});

// Delete user (soft delete - mark as inactive)
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const force = req.query.hard === "true" || req.body?.force === true;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  if (force) {
    // Hard delete
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      throw new apiError(404, "User not found");
    }
    return res
      .status(200)
      .json(new apiResponse(200, { deletedId: deleted._id }, "User permanently deleted"));
  } else {
    // Soft delete (existing behavior)
    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
    if (!user) {
      throw new apiError(404, "User not found");
    }
    return res
      .status(200)
      .json(new apiResponse(200, user, "User soft-deleted (isActive=false)"));
  }
});

// Block/Unblock user
const blockUnblockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { isBlocked } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  if (typeof isBlocked !== "boolean") {
    throw new apiError(400, "isBlocked must be a boolean");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { isBlocked },
    { new: true },
  );

  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        user,
        `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
      ),
    );
});

// Toggle login ability
const toggleCanLogin = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { canLogin } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  if (typeof canLogin !== "boolean") {
    throw new apiError(400, "canLogin must be a boolean");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { canLogin },
    { new: true },
  );

  if (!user) {
    throw new apiError(404, "User not found");
  }
  // if (canLogin === true) {
  //   throw new apiError(404, "User already can login");
  // }

  // Auto-generate UserLogin credentials when enabling login
  if (canLogin) {
    // Check if UserLogin record already exists
    const existingLogin = await UserLogin.findOne({ user: userId });

    if (!existingLogin) {
      // Generate username from user's name and ID
      const baseUsername = user.name
        .toLowerCase()
        .replace(/\s+/g, ".")
        .slice(0, 10);
      let username = baseUsername;
      let counter = 1;

      // Ensure unique username
      while (await UserLogin.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Generate a random password
      const randomPassword = generateRandomPassword();

      // Create UserLogin record - let asyncHandler catch errors
      const loginRecord = await UserLogin.create({
        user: userId,
        username,
        password: randomPassword,
      });

      console.log("✅ UserLogin created:", { userId, username });

      return res.status(201).json(
        new apiResponse(
          201,
          {
            user,
            login: {
              username,
              password: randomPassword,
              message: "Login credentials auto-generated. Please change password on first login.",
            },
          },
          "User login enabled and credentials auto-generated",
        ),
      );
    } else {
      console.log("⚠️ UserLogin already exists:", { userId, username: existingLogin.username });
      return res.status(200).json(
        new apiResponse(
          200,
          {
            user,
            login: {
              username: existingLogin.username,
              message: "Login credentials already exist for this user",
            },
          },
          "User login enabled (credentials already exist)",
        ),
      );
    }
  }

  // If canLogin is false
  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        user,
        `User login disabled successfully`,
      ),
    );
});

// Helper function to generate random password
const generateRandomPassword = () => {
  const length = process.env.PASSWORD_LENGTH;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Update user permissions
const updateUserPermissions = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { permissions } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new apiError(400, "Invalid user ID");
  }

  if (!Array.isArray(permissions)) {
    throw new apiError(400, "Permissions must be an array");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { permissions },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw new apiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, user, "User permissions updated successfully"));
});

// Get users by organization
const getUsersByOrganization = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(organizationId)) {
    throw new apiError(400, "Invalid organization ID");
  }

  const skip = (page - 1) * limit;

  const users = await User.find({ organizationId, isActive: true })
    .populate("reportingTo", "name email role")
    .populate("branchId", "name")
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const totalUsers = await User.countDocuments({ organizationId, isActive: true });

  return res.status(200).json(
    new apiResponse(200, {
      users,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalUsers / limit),
      },
    }),
  );
});

// Get users by role
const getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { organizationId, page = 1, limit = 10 } = req.query;

  if (!["enterprise_admin", "super_admin", "admin", "user"].includes(role)) {
    throw new apiError(400, "Invalid role provided");
  }

  const filter = { role, isActive: true };

  if (organizationId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new apiError(400, "Invalid organization ID");
    }
    filter.organizationId = organizationId;
  }

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .populate("reportingTo", "name email role")
    .populate("organizationId", "name")
    .populate("branchId", "name")
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const totalUsers = await User.countDocuments(filter);

  return res.status(200).json(
    new apiResponse(200, {
      users,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalUsers / limit),
      },
    }),
  );
});

// Count users by role and organization
const getUserStats = asyncHandler(async (req, res) => {
  const { organizationId } = req.query;

  const match = { isActive: true };

  if (organizationId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) {
      throw new apiError(400, "Invalid organization ID");
    }
    match.organizationId = new mongoose.Types.ObjectId(organizationId);
  }

  const stats = await User.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return res.status(200).json(new apiResponse(200, stats, "User statistics fetched"));
});

export {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  inActiveUser,
  deleteUser,
  blockUnblockUser,
  toggleCanLogin,
  updateUserPermissions,
  getUsersByOrganization,
  getUsersByRole,
  getUserStats,
};