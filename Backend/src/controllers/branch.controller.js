import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { School } from "../models/school.model.js";
import { Organization } from "../models/organization.model.js";
import mongoose from "mongoose";

// Create branch for an organization
const createBranch = asyncHandler(async (req, res) => {
  const { name, code, address, organizationId } = req.body;
  if (!name || !organizationId) throw new apiError(400, "Name and organizationId required");
  if (!mongoose.Types.ObjectId.isValid(organizationId)) throw new apiError(400, "Invalid organizationId");

  const org = await Organization.findById(organizationId);
  if (!org) throw new apiError(404, "Organization not found");

  const branch = await School.create({
    name,
    code,
    address,
    organizationId,
    createdBy: req.user?._id || null,
  });

  return res.status(201).json(new apiResponse(201, branch, "Branch created"));
});

// Get branches (with optional org filter)
const getBranches = asyncHandler(async (req, res) => {
  const { organizationId, page = 1, limit = process.env.PAGE_LIMIT || 10, isActive } = req.query;
  const filter = {};
  if (organizationId) {
    if (!mongoose.Types.ObjectId.isValid(organizationId)) throw new apiError(400, "Invalid organizationId");
    filter.organizationId = organizationId;
  }
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const skip = (page - 1) * limit;
  const branches = await School.find(filter).skip(skip).limit(parseInt(limit)).lean();
  const total = await School.countDocuments(filter);

  return res.status(200).json(new apiResponse(200, { branches, pagination: { total, page: parseInt(page), limit: parseInt(limit) } }));
});

// Get branch by id
const getBranchById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new apiError(400, "Invalid branch id");
  const branch = await School.findById(id).populate("organizationId", "name");
  if (!branch) throw new apiError(404, "Branch not found");
  return res.status(200).json(new apiResponse(200, branch));
});

// Update branch
const updateBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new apiError(400, "Invalid branch id");

  if (data.organizationId && !mongoose.Types.ObjectId.isValid(data.organizationId)) throw new apiError(400, "Invalid organizationId");

  const branch = await School.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!branch) throw new apiError(404, "Branch not found");
  return res.status(200).json(new apiResponse(200, branch, "Branch updated"));
});

// Soft delete branch
const deleteBranch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new apiError(400, "Invalid branch id");

  const branch = await School.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!branch) throw new apiError(404, "Branch not found");
  return res.status(200).json(new apiResponse(200, branch, "Branch deactivated"));
});

export { createBranch, getBranches, getBranchById, updateBranch, deleteBranch };