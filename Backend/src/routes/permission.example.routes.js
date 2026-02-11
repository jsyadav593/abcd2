import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authorize, hasRole, requireAllPermissions } from '../middlewares/permission.middleware.js';

const router = Router();

/**
 * EXAMPLE USAGE - Permission middleware in routes
 * 
 * Different approaches to check permissions:
 */

// ============================================================================
// APPROACH 1: Check single permission
// ============================================================================
router.get(
  '/users',
  verifyJWT,
  authorize('USER_READ'), // Check if user has USER_READ permission
  asyncHandler(async (req, res) => {
    // Controller logic here
    // req.userRole is available with role info
    res.json({ message: 'List of users', userRole: req.userRole.code });
  })
);

// ============================================================================
// APPROACH 2: Check if user has ANY of the given permissions
// ============================================================================
router.post(
  '/users',
  verifyJWT,
  authorize('USER_CREATE', 'USER_PERMISSIONS'), // User must have at least ONE of these
  asyncHandler(async (req, res) => {
    // Create new user logic
    res.json({ message: 'User created', createdBy: req.user._id });
  })
);

// ============================================================================
// APPROACH 3: Check if user has ALL of the given permissions
// ============================================================================
router.patch(
  '/users/:userId/permissions',
  verifyJWT,
  requireAllPermissions('USER_UPDATE', 'USER_PERMISSIONS'), // Must have BOTH
  asyncHandler(async (req, res) => {
    // Update user permissions
    res.json({ message: 'Permissions updated' });
  })
);

// ============================================================================
// APPROACH 4: Check by role code (strict role checking)
// ============================================================================
router.delete(
  '/users/:userId',
  verifyJWT,
  hasRole('ROLE_ENTERPRISE_ADMIN', 'ROLE_SUPER_ADMIN'), // Only these 2 roles allowed
  asyncHandler(async (req, res) => {
    // Delete user logic
    res.json({ message: 'User deleted' });
  })
);

// ============================================================================
// APPROACH 5: Combine multiple checks (AND logic)
// ============================================================================
router.post(
  '/assets/:assetId/assign',
  verifyJWT,
  authorize('ASSET_ASSIGN'), // Must have asset assign permission
  asyncHandler(async (req, res) => {
    // Assign asset to user
    // Role info is in req.userRole
    
    const { assignToUserId } = req.body;

    // Additional logic: if user is branch admin, can only assign within their branch
    if (req.userRole.code === 'ROLE_BRANCH_ADMIN') {
      // Check if both users are in same branch
      // const userBranch = await getBranchOfUser(req.user.id);
      // const assignToBranch = await getBranchOfUser(assignToUserId);
      // if (userBranch !== assignToBranch) throw error
    }

    res.json({ message: 'Asset assigned' });
  })
);

// ============================================================================
// APPROACH 6: Using role level (hierarchy check)
// ============================================================================
router.post(
  '/settings',
  verifyJWT,
  async (req, res, next) => {
    // Manual level check
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

    const userRole = await Role.findById(req.user.roleId);
    
    // Only level 4 or above can manage settings
    if (userRole.level < 4) {
      return res.status(403).json({ message: 'Insufficient role level' });
    }

    next();
  },
  asyncHandler(async (req, res) => {
    // Manage settings logic
    res.json({ message: 'Settings updated' });
  })
);

export default router;

/**
 * ============================================================================
 * PERMISSION CHECKING IN CONTROLLERS (Alternative approach)
 * ============================================================================
 * 
 * Instead of middleware, you can check permissions inside controller:
 */

// Example Controller
/*
import { hasPermission } from '../middlewares/permission.middleware.js';

export const createUser = asyncHandler(async (req, res) => {
  // Check permission inside controller
  const canCreate = await hasPermission(req.user._id, req.user.roleId, 'USER_CREATE');
  
  if (!canCreate) {
    throw new ApiError(403, 'You do not have permission to create users');
  }

  // Rest of logic
  const newUser = await User.create(req.body);
  res.status(201).json(newUser);
});
*/

/**
 * ============================================================================
 * SCOPE-BASED CHECKS (Advanced)
 * ============================================================================
 * 
 * Some permissions depend on scope:
 * - Enterprise Admin can see ALL users
 * - Admin can see users in their DEPARTMENT
 * - Branch Admin can see users in their BRANCH
 * - Regular User can only see themselves
 */

/*
export const getUserList = asyncHandler(async (req, res) => {
  const user = req.user;
  const role = req.userRole;
  
  let query = {};

  if (role.code === 'ROLE_ENTERPRISE_ADMIN') {
    // See all users
    query = {};
  } else if (role.code === 'ROLE_SUPER_ADMIN') {
    // See users in their organization
    query = { organizationId: user.organizationId };
  } else if (role.code === 'ROLE_ADMIN') {
    // See users in their department
    query = { departmentId: user.departmentId };
  } else if (role.code === 'ROLE_BRANCH_ADMIN') {
    // See users in their branch
    query = { branchId: user.branchId };
  } else {
    // Regular user - only see themselves
    query = { _id: user._id };
  }

  const users = await User.find(query);
  res.json(users);
});
*/
