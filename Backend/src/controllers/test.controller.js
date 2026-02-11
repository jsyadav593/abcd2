import { User } from '../models/user.model.js';
import { Role } from '../models/role.model.js';
import { Permission } from '../models/permission.model.js';
import  {apiError}  from '../utils/apiError.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * TEST ENDPOINTS - For testing permission system
 * These are development/testing endpoints only
 */

// ============================================================================
// 1. Get All Roles (with permissions)
// ============================================================================
export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find({}).select('-createdBy');

  const rolesWithStats = roles.map(role => ({
    _id: role._id,
    name: role.name,
    code: role.code,
    level: role.level,
    scope: role.scope,
    permissionCount: role.permissions.length,
    permissions: role.permissions.slice(0, 5), // Show first 5
    isSystemRole: role.isSystemRole,
    isActive: role.isActive
  }));

  return res
    .status(200)
    .json(
      new apiResponse(200, rolesWithStats, `${roles.length} roles found`)
    );
});

// ============================================================================
// 2. Get Role Details (with all permissions)
// ============================================================================
export const getRoleDetails = asyncHandler(async (req, res) => {
  const { roleCode } = req.params;

  const role = await Role.findOne({ code: roleCode });
  if (!role) {
    throw new apiError(404, `Role ${roleCode} not found`);
  }

  return res
    .status(200)
    .json(
      new apiResponse(200, role, `Role ${roleCode} details`)
    );
});

// ============================================================================
// 3. Get All Permissions
// ============================================================================
export const getAllPermissions = asyncHandler(async (req, res) => {
  const permissions = await Permission.find({}).select('-createdAt -updatedAt');

  const grouped = {};
  permissions.forEach(perm => {
    if (!grouped[perm.module]) {
      grouped[perm.module] = [];
    }
    grouped[perm.module].push({
      code: perm.code,
      name: perm.name,
      action: perm.action
    });
  });

  return res
    .status(200)
    .json(
      new apiResponse(200, {
        total: permissions.length,
        byModule: grouped,
        allPermissions: permissions
      }, 'All permissions fetched')
    );
});

// ============================================================================
// 4. Create Test User with Role
// ============================================================================
export const createTestUser = asyncHandler(async (req, res) => {
  const { name, email, roleCode, organizationId } = req.body;

  if (!name || !email || !roleCode || !organizationId) {
    throw new apiError(400, 'name, email, roleCode, organizationId are required');
  }

  // Get role by code
  const role = await Role.findOne({ code: roleCode });
  if (!role) {
    throw new apiError(404, `Role ${roleCode} not found`);
  }

  // Create user
  const user = await User.create({
    userId: `USER_${Date.now()}`,
    name,
    email,
    roleId: role._id,
    organizationId,
    canLogin: true
  });

  // Return with role info
  const userWithRole = await User.findById(user._id).populate('roleId');

  return res
    .status(201)
    .json(
      new apiResponse(201, {
        user: {
          _id: userWithRole._id,
          name: userWithRole.name,
          email: userWithRole.email,
          role: userWithRole.roleId.name,
          roleCode: userWithRole.roleId.code,
          roleLevel: userWithRole.roleId.level,
          permissions: userWithRole.roleId.permissions.slice(0, 5)
        }
      }, 'Test user created successfully')
    );
});

// ============================================================================
// 5. Check User Permissions
// ============================================================================
export const checkUserPermissions = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { permissionCode } = req.query;

  const user = await User.findById(userId).populate('roleId');
  if (!user) {
    throw new apiError(404, 'User not found');
  }

  if (!user.roleId) {
    throw new apiError(400, 'User has no role assigned');
  }

  const permissions = user.roleId.permissions || [];
  const hasPermission = permissionCode ? permissions.includes(permissionCode) : false;

  return res
    .status(200)
    .json(
      new apiResponse(200, {
        userId: user._id,
        userName: user.name,
        roleCode: user.roleId.code,
        roleName: user.roleId.name,
        roleLevel: user.roleId.level,
        totalPermissions: permissions.length,
        [permissionCode ? 'hasPermission' : 'permissions']: permissionCode ? hasPermission : permissions,
        checkFor: permissionCode || 'all'
      }, 'User permissions retrieved')
    );
});

// ============================================================================
// 6. Test Permission System
// ============================================================================
export const testPermissionSystem = asyncHandler(async (req, res) => {
  console.log('🧪 Testing permission system...');

  // Check if roles exist
  const roles = await Role.find({});
  const permissions = await Permission.find({});

  if (roles.length === 0 || permissions.length === 0) {
    throw new apiError(500, 'Permission system not initialized. Run seed first.');
  }

  // Get counts by module
  const permissionsByModule = {};
  permissions.forEach(p => {
    if (!permissionsByModule[p.module]) {
      permissionsByModule[p.module] = 0;
    }
    permissionsByModule[p.module]++;
  });

  // Get role details
  const roleDetails = roles.map(role => ({
    name: role.name,
    code: role.code,
    level: role.level,
    scope: role.scope,
    permissionCount: role.permissions.length
  }));

  const testResults = {
    system: 'INITIALIZED ✅',
    stats: {
      totalPermissions: permissions.length,
      totalRoles: roles.length,
      permissionsByModule: permissionsByModule,
      roles: roleDetails
    },
    example: {
      message: 'Permission system is ready to use',
      exampleFlow: [
        '1. Create user with roleId (e.g., ROLE_ENTERPRISE_ADMIN)',
        '2. User makes request with JWT token',
        '3. authorize(\'PERMISSION_CODE\') middleware checks permission',
        '4. If user has permission → proceed to controller',
        '5. If user lacks permission → return 403 Forbidden'
      ]
    },
    endpoints: {
      'GET /api/test/roles': 'List all roles',
      'GET /api/test/roles/:roleCode': 'Get role details',
      'GET /api/test/permissions': 'List all permissions',
      'POST /api/test/users': 'Create test user',
      'GET /api/test/users/:userId': 'Check user permissions',
      'GET /api/test/system': 'Test system (this endpoint)'
    }
  };

  return res
    .status(200)
    .json(
      new apiResponse(200, testResults, 'Permission system test successful ✅')
    );
});

// ============================================================================
// 7. Reset Test Data (Delete all test users)
// ============================================================================
export const resetTestData = asyncHandler(async (req, res) => {
  // Only delete users created for testing (not system users)
  const result = await User.deleteMany({
    email: { $regex: /@test\.com$/ }
  });

  return res
    .status(200)
    .json(
      new apiResponse(200, {
        deletedCount: result.deletedCount
      }, `${result.deletedCount} test users deleted`)
    );
});

// ============================================================================
// 8. List All Users with Their Roles
// ============================================================================
export const listUsersWithRoles = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .populate('roleId', 'name code level')
    .select('_id name email roleId role isActive')
    .limit(20);

  const usersWithRoles = users.map(u => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.roleId ? `${u.roleId.name} (Level ${u.roleId.level})` : 'No role assigned',
    roleCode: u.roleId?.code || 'NONE',
    isActive: u.isActive
  }));

  return res
    .status(200)
    .json(
      new apiResponse(200, usersWithRoles, `${users.length} users fetched`)
    );
});
