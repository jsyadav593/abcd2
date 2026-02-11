// Method	Route	Function	Purpose

// POST	/	createUser	Create new user
// GET	/	getAllUsers	Get all users with filters
// GET	/:userId	getUserById	Fetch single user
// PATCH	/:userId	updateUser	Update user details
// DELETE	/:userId	deleteUser	Soft delete user
// PATCH	/:userId/block-unblock	blockUnblockUser	Block/unblock user
// PATCH	/:userId/toggle-login	toggleCanLogin	Enable/disable login
// PATCH	/:userId/permissions	updateUserPermissions	Update permissions
// GET	/org/:organizationId	getUsersByOrganization	Filter by organization
// GET	/role/:role	getUsersByRole	Filter by role
// GET	/stats/all	getUserStats	Get statistics


import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate, sanitizeQueryParams } from "../middlewares/validation.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  toggleCanLoginSchema,
  blockUnblockSchema,
  paginationSchema,
} from "../validators/userValidator.js";

const router = Router();

// Apply sanitization to all query params
router.use(sanitizeQueryParams);

// ==================== User CRUD Operations ====================

//! Create a new user
// POST /api/users
router.post("/", 
  validate(createUserSchema, 'body'),
  createUser);

//! Get all users with filtering and pagination
// GET /api/users?organizationId=&role=&isActive=&page=1&limit=10
router.get("/", 
  getAllUsers);

//! Get user by ID
// GET /api/users/:userId
router.get("/:userId", 
  getUserById);

//! Update user
// PATCH /api/users/:userId
router.patch("/:userId", 
  validate(updateUserSchema, 'body'),
  updateUser);

//! Delete user (soft delete)
// DELETE /api/users/:userId
router.delete("/:userId", 
  deleteUser);

// ==================== User Management Operations ====================

//! Block/Unblock user
// PATCH /api/users/:userId/block-unblock
router.patch("/:userId/block-unblock", 
  validate(blockUnblockSchema, 'body'),
  blockUnblockUser);

//! Toggle user login ability
// PATCH /api/users/:userId/toggle-login
router.patch("/:userId/toggle-login", 
  validate(toggleCanLoginSchema, 'body'),
  toggleCanLogin);

//! Update user permissions
// PATCH /api/users/:userId/permissions
router.patch("/:userId/permissions", 
  protect, 
  updateUserPermissions);

// ==================== User Filtering and Analytics ====================

//! Get users by organization
// GET /api/users/org/:organizationId?page=1&limit=10
router.get("/org/:organizationId", 
  protect, 
  getUsersByOrganization);

//! Get users by role
// GET /api/users/role/:role?organizationId=&page=1&limit=10
router.get("/role/:role", 
  protect, 
  getUsersByRole);

//! Get user statistics
// GET /api/users/stats/all
router.get("/stats/all", 
  getUserStats);

export default router;