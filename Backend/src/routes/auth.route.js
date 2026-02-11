// Auth Data Routes
// Routes for getting user profile, access levels, and filtered user lists

import { Router } from "express";
import {
  getCurrentUser,
  getUserProfile,
  getUsersByProfessionalLevel,
  getUsersByIndustry,
  getUserAccessLevel,
} from "../controllers/auth.controller.js";
import { protect, checkUserStatus } from "../middlewares/auth.middleware.js";

const router = Router();

// ==================== Protected Routes (Authenticated Users) ====================

//! Get current logged-in user data
// GET /api/auth-data/me
// Returns: User info from access token
router.get("/me", protect, getCurrentUser);

//! Get complete user profile with industry and professional level
// GET /api/auth-data/profile
// Returns: Detailed user profile including role, level, industry, permissions
router.get("/profile", protect, getUserProfile);

//! Get user access level and allowed modules
// GET /api/auth-data/access-level
// Returns: Access modules, permissions, data access level
router.get("/access-level", protect, getUserAccessLevel);

// ==================== Public Routes (Admin/Manager can filter) ====================

//! Get users filtered by professional level
// GET /api/auth-data/users/level?level=executive&organizationId=&page=1&limit=10
// Query params: level (executive, management, staff), organizationId, page, limit
// Returns: List of users with matching professional level
router.get("/users/level", protect, getUsersByProfessionalLevel);

//! Get users filtered by industry
// GET /api/auth-data/users/industry?industry=IT&page=1&limit=10
// Query params: industry, page, limit
// Returns: List of users from specific industry
router.get("/users/industry", protect, getUsersByIndustry);

export default router;
