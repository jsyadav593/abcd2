import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Organization } from "../models/organization.model.js";
import mongoose from "mongoose";

// Create organization
const createOrganization = asyncHandler(async (req, res) => {
  const { name, code, address, contactEmail, contactPhone } = req.body;
  if (!name) throw new apiError(400, "Organization name is required");

  const existing = code ? await Organization.findOne({ code }) : null;
  if (existing) throw new apiError(400, "Organization code already exists");

  const org = await Organization.create({
    name,
    code,
    address,
    contactEmail,
    contactPhone,
    createdBy: req.user?._id || null,
  });

  return res.status(201).json(new apiResponse(201, org, "Organization created"));
});

// Get organizations (filter/pagination)
const getOrganizations = asyncHandler(async (req, res) => {
  const { page = 1, limit = process.env.PAGE_LIMIT || 10, isActive } = req.query;
  const filter = {};
  if (isActive !== undefined) filter.isActive = isActive === "true";
  const skip = (page - 1) * limit;

  const orgs = await Organization.find(filter).skip(skip).limit(parseInt(limit)).lean();
  const total = await Organization.countDocuments(filter);

  return res.status(200).json(
    new apiResponse(200, { orgs, pagination: { total, page: parseInt(page), limit: parseInt(limit) } })
  );
});

// Get organization by id
const getOrganizationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new apiError(400, "Invalid organization id");
  const org = await Organization.findById(id);
  if (!org) throw new apiError(404, "Organization not found");
  return res.status(200).json(new apiResponse(200, org));
});

// Update organization
const updateOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new apiError(400, "Invalid organization id");

  const org = await Organization.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!org) throw new apiError(404, "Organization not found");
  return res.status(200).json(new apiResponse(200, org, "Organization updated"));
});

// Soft delete organization
const deleteOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw new apiError(400, "Invalid organization id");

  const org = await Organization.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!org) throw new apiError(404, "Organization not found");
  return res.status(200).json(new apiResponse(200, org, "Organization deactivated"));
});

export { createOrganization, getOrganizations, getOrganizationById, updateOrganization, deleteOrganization };