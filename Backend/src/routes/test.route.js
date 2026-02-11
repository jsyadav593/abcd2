import { Router } from 'express';
import {
  getAllRoles,
  getRoleDetails,
  getAllPermissions,
  createTestUser,
  checkUserPermissions,
  testPermissionSystem,
  resetTestData,
  listUsersWithRoles
} from '../controllers/test.controller.js';

const router = Router();

// ============================================================================
// TEST ENDPOINTS - NON-PROTECTED (for testing only)
// ============================================================================

/**
 * @route   GET /api/test/system
 * @desc    Test if permission system is initialized
 * @access  Public
 * @response { stats, example, endpoints }
 */
router.get('/system', testPermissionSystem);

/**
 * @route   GET /api/test/roles
 * @desc    List all roles with their permission counts
 * @access  Public
 */
router.get('/roles', getAllRoles);

/**
 * @route   GET /api/test/roles/:roleCode
 * @desc    Get complete role details with all permissions
 * @access  Public
 * @param   roleCode - Role code (e.g., ROLE_ENTERPRISE_ADMIN)
 */
router.get('/roles/:roleCode', getRoleDetails);

/**
 * @route   GET /api/test/permissions
 * @desc    List all permissions (grouped by module)
 * @access  Public
 */
router.get('/permissions', getAllPermissions);

/**
 * @route   POST /api/test/users
 * @desc    Create a test user with assigned role
 * @access  Public
 * @body    { name, email, roleCode, organizationId }
 * @example { name: "John Admin", email: "john@test.com", roleCode: "ROLE_ADMIN", organizationId: "123..." }
 */
router.post('/users', createTestUser);

/**
 * @route   GET /api/test/users
 * @desc    List all users with their assigned roles
 * @access  Public
 */
router.get('/users', listUsersWithRoles);

/**
 * @route   GET /api/test/users/:userId
 * @desc    Check a user's permissions
 * @access  Public
 * @param   userId - User ID
 * @query   permissionCode - (optional) Check specific permission
 * @example /api/test/users/123?permissionCode=USER_CREATE
 */
router.get('/users/:userId', checkUserPermissions);

/**
 * @route   POST /api/test/reset
 * @desc    Delete all test users (email ends with @test.com)
 * @access  Public
 */
router.post('/reset', resetTestData);

export default router;
