import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * REAL-WORLD EXAMPLE CONTROLLER
 * Shows how to implement permission checks in actual controllers
 */

// ============================================================================
// 1. CREATE USER - Permission checked via middleware
// ============================================================================
export const createUser = asyncHandler(async (req, res) => {
  // Note: authorize('USER_CREATE') middleware ne already check kar diya
  // Agar yaha tak pohunche to user's paas definitely ye permission hai

  const { name, email, phone, roleId, organizationId } = req.body;

  // Additional check: Can user create roles higher than their own?
  const targetRole = await Role.findById(roleId);
  const userRole = await Role.findById(req.user.roleId);

  if (targetRole.level > userRole.level) {
    throw new ApiError(
      403,
      `You can only create users with role level ${userRole.level} or lower. Cannot create level ${targetRole.level}`
    );
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    roleId,
    organizationId,
    createdBy: req.user._id
  });

  return res
    .status(201)
    .json(new ApiResponse(201, user, 'User created successfully'));
});

// ============================================================================
// 2. LIST USERS - Scope-aware (What users can they see?)
// ============================================================================
export const listUsers = asyncHandler(async (req, res) => {
  const currentUser = req.user;
  const userRole = req.userRole;
  let query = {};

  // Build query based on user's role and scope
  switch (userRole.code) {
    case 'ROLE_ENTERPRISE_ADMIN':
      // See ALL users in system
      query = {};
      break;

    case 'ROLE_SUPER_ADMIN':
      // See users in their organization only
      query = { organizationId: currentUser.organizationId };
      break;

    case 'ROLE_ADMIN':
      // See users in their department only
      query = { departmentId: currentUser.departmentId };
      break;

    case 'ROLE_BRANCH_ADMIN':
      // See users in their branch
      query = { branchId: currentUser.branchId };
      break;

    case 'ROLE_USER':
      // Regular users can only see themselves
      query = { _id: currentUser._id };
      break;
  }

  const users = await User.find(query).select('-password');
  
  return res
    .status(200)
    .json(
      new ApiResponse(200, users, 'Users fetched successfully')
    );
});

// ============================================================================
// 3. UPDATE USER - Can only update if they have permission
// ============================================================================
export const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;

  const targetUser = await User.findById(userId);
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  // Permission check: USER_UPDATE already checked by middleware
  // But add scope check: Can this user update the target user?

  const userRole = req.userRole;
  const currentUser = req.user;

  // Scope validation
  if (userRole.code === 'ROLE_ADMIN' && targetUser.departmentId !== currentUser.departmentId) {
    throw new ApiError(403, 'Cannot update user outside your department');
  }

  if (userRole.code === 'ROLE_BRANCH_ADMIN' && targetUser.branchId !== currentUser.branchId) {
    throw new ApiError(403, 'Cannot update user outside your branch');
  }

  // Prevent role downgrade/upgrade beyond user's level
  if (updateData.roleId) {
    const newRole = await Role.findById(updateData.roleId);
    if (newRole.level > userRole.level) {
      throw new ApiError(403, `Cannot assign role level higher than your own`);
    }
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, 'User updated successfully')
    );
});

// ============================================================================
// 4. DELETE USER - Only Enterprise/Super Admin
// ============================================================================
export const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // This route should have: hasRole('ROLE_ENTERPRISE_ADMIN', 'ROLE_SUPER_ADMIN')
  // So agar yaha tak aaye, to definitely authorized hai

  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, 'User deleted successfully')
    );
});

// ============================================================================
// 5. DISABLE USER - Multiple permissions allowed
// ============================================================================
export const disableUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Route has: authorize('USER_DISABLE')
  // Multiple roles can have this permission

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Scope check
  if (req.userRole.code === 'ROLE_ADMIN') {
    if (user.departmentId !== req.user.departmentId) {
      throw new ApiError(403, 'Cannot disable user outside your department');
    }
  }

  if (req.userRole.code === 'ROLE_BRANCH_ADMIN') {
    if (user.branchId !== req.user.branchId) {
      throw new ApiError(403, 'Cannot disable user outside your branch');
    }
  }

  // Disable user
  user.isActive = false;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, 'User disabled successfully')
    );
});

// ============================================================================
// 6. ASSIGN ASSET - Scope-aware permission
// ============================================================================
export const assignAsset = asyncHandler(async (req, res) => {
  const { assetId } = req.params;
  const { assignToUserId } = req.body;

  // Route has: authorize('ASSET_ASSIGN')

  const asset = await Asset.findById(assetId);
  const targetUser = await User.findById(assignToUserId);

  if (!asset) throw new ApiError(404, 'Asset not found');
  if (!targetUser) throw new ApiError(404, 'Target user not found');

  const userRole = req.userRole;

  // Scope-based assignment rules
  switch (userRole.code) {
    case 'ROLE_ENTERPRISE_ADMIN':
      // Can assign to anyone
      break;

    case 'ROLE_SUPER_ADMIN':
      // Can assign within organization
      if (asset.organizationId !== req.user.organizationId ||
          targetUser.organizationId !== req.user.organizationId) {
        throw new ApiError(403, 'Cannot assign asset outside your organization');
      }
      break;

    case 'ROLE_ADMIN':
      // Can assign within department
      if (asset.departmentId !== req.user.departmentId ||
          targetUser.departmentId !== req.user.departmentId) {
        throw new ApiError(403, 'Cannot assign asset outside your department');
      }
      break;

    case 'ROLE_BRANCH_ADMIN':
      // Can assign within branch
      if (asset.branchId !== req.user.branchId ||
          targetUser.branchId !== req.user.branchId) {
        throw new ApiError(403, 'Cannot assign asset outside your branch');
      }
      break;

    default:
      throw new ApiError(403, 'Insufficient role for asset assignment');
  }

  // Assign asset
  asset.assignedTo = assignToUserId;
  asset.assignedAt = new Date();
  asset.assignedBy = req.user._id;
  await asset.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, asset, 'Asset assigned successfully')
    );
});

// ============================================================================
// 7. GET USER PERMISSIONS - Admin utility
// ============================================================================
export const getUserPermissions = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate('roleId');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const role = user.roleId;

  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        userId: user._id,
        userName: user.name,
        roleCode: role.code,
        roleName: role.name,
        roleLevel: role.level,
        permissions: role.permissions,
        permissionCount: role.permissions.length
      }, 'User permissions fetched successfully')
    );
});

// ============================================================================
// 8. CHECK IF USER CAN PERFORM ACTION - Utility endpoint
// ============================================================================
export const canUserPerformAction = asyncHandler(async (req, res) => {
  const { userId, permissionCode } = req.query;

  if (!userId || !permissionCode) {
    throw new ApiError(400, 'userId and permissionCode are required');
  }

  const user = await User.findById(userId).populate('roleId');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const hasPermission = user.roleId.permissions.includes(permissionCode);

  return res
    .status(200)
    .json(
      new ApiResponse(200, {
        userId,
        permissionCode,
        hasPermission,
        roleName: user.roleId.name,
        roleLevel: user.roleId.level
      }, hasPermission ? 'User can perform action' : 'User cannot perform action')
    );
});

// ============================================================================
// 9. CHANGE USER ROLE - Only if authorized
// ============================================================================
export const changeUserRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { newRoleId } = req.body;

  // This should require: requireAllPermissions('USER_UPDATE', 'USER_PERMISSIONS')

  const user = await User.findById(userId);
  const newRole = await Role.findById(newRoleId);
  const userRole = req.userRole;

  if (!user) throw new ApiError(404, 'User not found');
  if (!newRole) throw new ApiError(404, 'Role not found');

  // Permission check: Can only assign roles at same level or lower
  if (newRole.level > userRole.level) {
    throw new ApiError(
      403,
      `You can only assign roles at level ${userRole.level} or lower`
    );
  }

  // Update role
  user.roleId = newRoleId;
  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, 'User role changed successfully')
    );
});

/**
 * ========================================================================
 * ROUTE CONFIGURATION
 * ========================================================================
 * 
 * In your user.route.js:
 * 
 * import { authorize, hasRole, requireAllPermissions } from '../middlewares/permission.middleware.js';
 * 
 * router.post('/users', verifyJWT, authorize('USER_CREATE'), createUser);
 * router.get('/users', verifyJWT, authorize('USER_READ'), listUsers);
 * router.patch('/users/:userId', verifyJWT, authorize('USER_UPDATE'), updateUser);
 * router.delete('/users/:userId', verifyJWT, hasRole('ROLE_ENTERPRISE_ADMIN', 'ROLE_SUPER_ADMIN'), deleteUser);
 * router.post('/users/:userId/disable', verifyJWT, authorize('USER_DISABLE'), disableUser);
 * router.post('/assets/:assetId/assign', verifyJWT, authorize('ASSET_ASSIGN'), assignAsset);
 * router.get('/users/:userId/permissions', verifyJWT, authorize('USER_PERMISSIONS'), getUserPermissions);
 * router.get('/check-permission', verifyJWT, canUserPerformAction);
 * router.post('/users/:userId/change-role', verifyJWT, requireAllPermissions('USER_UPDATE', 'USER_PERMISSIONS'), changeUserRole);
 */
