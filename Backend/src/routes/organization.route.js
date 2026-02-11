import { Router } from "express";
import {
  createOrganization,
  getOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
} from "../controllers/organization.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", protect, createOrganization);
router.get("/", protect, getOrganizations);
router.get("/:id", protect, getOrganizationById);
router.patch("/:id", protect, updateOrganization);
router.delete("/:id", protect, deleteOrganization);

export default router;