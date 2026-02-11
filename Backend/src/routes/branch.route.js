import { Router } from "express";
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "../controllers/branch.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", protect, createBranch);
router.get("/", protect, getBranches);
router.get("/:id", protect, getBranchById);
router.patch("/:id", protect, updateBranch);
router.delete("/:id", protect, deleteBranch);

export default router;