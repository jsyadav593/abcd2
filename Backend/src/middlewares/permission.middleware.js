import { Role } from '../models/role.model.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Check if user has specific permission(s)
 * Usage in controller:
 * router.post('/users', authorize('USER_CREATE'), createUser);
 */
export const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // req.user set ho gaya hona auth.middleware se
      if (!req.user) {
        throw new ApiError(401, 'User not authenticated');
      }

      // User ka role get karo
      const userRole = await Role.findById(req.user.roleId);
      if (!userRole) {
        throw new ApiError(403, 'No role assigned to user');
      }

      // Check karo ke user ke paas required permissions hain ya nahi
      const userPermissions = userRole.permissions || [];
      const hasPermission = requiredPermissions.some(perm => 
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        throw new ApiError(
          403,
          `You don't have permission to perform this action. Required: ${requiredPermissions.join(', ')}`
        );
      }

      // User ke role info ko request mein store karo (aage use ke liye)
      req.userRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check multiple permissions (ALL required)
 * Usage: requireAllPermissions('USER_CREATE', 'USER_DELETE')
 */
export const requireAllPermissions = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'User not authenticated');
      }

      const userRole = await Role.findById(req.user.roleId);
      if (!userRole) {
        throw new ApiError(403, 'No role assigned to user');
      }

      const userPermissions = userRole.permissions || [];
      const hasAllPermissions = requiredPermissions.every(perm => 
        userPermissions.includes(perm)
      );

      if (!hasAllPermissions) {
        throw new ApiError(403, 'Insufficient permissions for this action');
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has certain role level
 * Example: roleLevel(3) means user must be level 3 or higher
 */
export const roleLevel = (minLevel) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'User not authenticated');
      }

      const userRole = await Role.findById(req.user.roleId);
      if (!userRole) {
        throw new ApiError(403, 'No role assigned to user');
      }

      if (userRole.level < minLevel) {
        throw new ApiError(
          403,
          `This action requires role level ${minLevel} or higher. Your level: ${userRole.level}`
        );
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user role code matches
 * Example: hasRole('ROLE_ADMIN', 'ROLE_ENTERPRISE_ADMIN')
 */
export const hasRole = (...roleCodes) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'User not authenticated');
      }

      const userRole = await Role.findById(req.user.roleId);
      if (!userRole) {
        throw new ApiError(403, 'No role assigned to user');
      }

      if (!roleCodes.includes(userRole.code)) {
        throw new ApiError(
          403,
          `Access denied. Required roles: ${roleCodes.join(', ')}`
        );
      }

      req.userRole = userRole;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Utility: Get all permissions for a role
 */
export const getRolePermissions = async (roleId) => {
  try {
    const role = await Role.findById(roleId);
    return role?.permissions || [];
  } catch (error) {
    return [];
  }
};

/**
 * Utility: Check specific permission for user
 * Can call this directly from controller logic
 */
export const hasPermission = async (userId, roleId, permissionCode) => {
  try {
    const role = await Role.findById(roleId);
    if (!role) return false;
    return role.permissions.includes(permissionCode);
  } catch (error) {
    return false;
  }
};
