// Auth Controller - Extended authentication features
// Handles user data retrieval based on roles, industries, and professional levels

import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { UserLogin } from "../models/userLogin.model.js";

// Get current user data (from access token)
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const userLogin = await UserLogin.findOne({ user: userId })
    .populate({
      path: "user",
      select: "userId name designation department email role permissions organizationId branchId isActive isBlocked canLogin",
      populate: [
        {
          path: "organizationId",
          select: "name type industry",
        },
        {
          path: "branchId",
          select: "name address city",
        },
      ],
    });

  if (!userLogin) {
    throw new apiError(404, "User login record not found");
  }

  return res.status(200).json(
    new apiResponse(
      200,
      {
        username: userLogin.username,
        user: userLogin.user,
        isLoggedIn: userLogin.isLoggedIn,
        lastLogin: userLogin.lastLogin,
      },
      "Current user data fetched successfully"
    )
  );
});

// Get user profile with industry and professional level details
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId)
    .populate("organizationId", "name type industry")
    .populate("branchId", "name address city")
    .populate("reportingTo", "name designation email");

  if (!user) {
    throw new apiError(404, "User not found");
  }

  // Get user login info
  const userLogin = await UserLogin.findOne({ user: userId });

  // Classify professional level based on role
  const professionalLevel = getProfessionalLevel(user.role);
  const industryCategory = getIndustryCategory(user.organizationId?.industry);

  // Prepare user profile based on role and professional level
  const userProfile = {
    basicInfo: {
      userId: user.userId,
      name: user.name,
      email: user.email,
      designation: user.designation,
      department: user.department,
    },
    roleInfo: {
      role: user.role,
      professionalLevel: professionalLevel,
      permissions: user.permissions || [],
    },
    organizationInfo: {
      organizationId: user.organizationId?._id,
      organizationName: user.organizationId?.name,
      organizationType: user.organizationId?.type,
      industry: user.organizationId?.industry,
      industryCategory: industryCategory,
    },
    branchInfo: user.branchId,
    reportingInfo: user.reportingTo ? {
      reportingToId: user.reportingTo._id,
      reportingToName: user.reportingTo.name,
      reportingToDesignation: user.reportingTo.designation,
    } : null,
    accountStatus: {
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      canLogin: user.canLogin,
      isLoggedIn: userLogin?.isLoggedIn || false,
      lastLogin: userLogin?.lastLogin || null,
    },
    timestamps: {
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };

  return res.status(200).json(
    new apiResponse(200, userProfile, "User profile fetched successfully")
  );
});

// Get users by professional level (for filtering/displaying)
const getUsersByProfessionalLevel = asyncHandler(async (req, res) => {
  const { level, organizationId, page = 1, limit = 10 } = req.query;

  if (!level) {
    throw new apiError(400, "Professional level is required");
  }

  // Map level to roles
  const roleMap = {
    executive: ["enterprise_admin", "super_admin"],
    management: ["admin"],
    staff: ["user"],
  };

  const roles = roleMap[level.toLowerCase()];
  if (!roles) {
    throw new apiError(400, "Invalid professional level");
  }

  let query = { role: { $in: roles } };
  if (organizationId) {
    query.organizationId = organizationId;
  }

  const skip = (page - 1) * limit;
  const users = await User.find(query)
    .populate("organizationId", "name type industry")
    .populate("branchId", "name")
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
      "Users fetched by professional level"
    )
  );
});

// Get users by industry
const getUsersByIndustry = asyncHandler(async (req, res) => {
  const { industry, page = 1, limit = 10 } = req.query;

  if (!industry) {
    throw new apiError(400, "Industry is required");
  }

  const skip = (page - 1) * limit;

  // Find organizations with this industry, then find users in those orgs
  const users = await User.find()
    .populate({
      path: "organizationId",
      match: { industry: new RegExp(industry, "i") },
      select: "name type industry",
    })
    .populate("branchId", "name")
    .skip(skip)
    .limit(parseInt(limit));

  // Filter out users without matching organizations
  const filteredUsers = users.filter((user) => user.organizationId !== null);
  const total = filteredUsers.length;

  return res.status(200).json(
    new apiResponse(
      200,
      {
        users: filteredUsers,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
      "Users fetched by industry"
    )
  );
});

// Helper function to get professional level from role
function getProfessionalLevel(role) {
  const levelMap = {
    enterprise_admin: {
      level: "EXECUTIVE",
      levelCode: "L5",
      hierarchy: 5,
      description: "Enterprise Administrator - Highest level authority",
    },
    super_admin: {
      level: "EXECUTIVE",
      levelCode: "L4",
      hierarchy: 4,
      description: "Super Administrator - System-wide authority",
    },
    admin: {
      level: "MANAGEMENT",
      levelCode: "L3",
      hierarchy: 3,
      description: "Administrator - Department/Team management",
    },
    user: {
      level: "STAFF",
      levelCode: "L1",
      hierarchy: 1,
      description: "Staff Member - Regular user",
    },
  };

  return levelMap[role] || levelMap.user;
}

// Helper function to get industry category
function getIndustryCategory(industry) {
  if (!industry) return "GENERAL";

  const industryMap = {
    IT: "INFORMATION_TECHNOLOGY",
    "Information Technology": "INFORMATION_TECHNOLOGY",
    Finance: "FINANCE",
    Banking: "FINANCE",
    Healthcare: "HEALTHCARE",
    Medical: "HEALTHCARE",
    Education: "EDUCATION",
    Manufacturing: "MANUFACTURING",
    Retail: "RETAIL",
    "E-Commerce": "ECOMMERCE",
    Telecom: "TELECOMMUNICATIONS",
    Government: "GOVERNMENT",
    Defense: "DEFENSE",
    Legal: "LEGAL",
    Consulting: "CONSULTING",
    Engineering: "ENGINEERING",
    Construction: "CONSTRUCTION",
    Real_Estate: "REAL_ESTATE",
    Hospitality: "HOSPITALITY",
    Transportation: "TRANSPORTATION",
    Energy: "ENERGY",
    Utilities: "UTILITIES",
    Media: "MEDIA",
    Entertainment: "ENTERTAINMENT",
    Food_Beverage: "FOOD_BEVERAGE",
    Apparel: "APPAREL",
    Agriculture: "AGRICULTURE",
    Pharma: "PHARMACEUTICAL",
  };

  return industryMap[industry] || industry.toUpperCase();
}

// Get user access level and permissions based on role and industry
const getUserAccessLevel = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId).populate("organizationId", "industry");

  if (!user) {
    throw new apiError(404, "User not found");
  }

  const professionalLevel = getProfessionalLevel(user.role);
  const industryCategory = getIndustryCategory(user.organizationId?.industry);

  // Define access modules based on professional level and industry
  const accessModules = getAccessModules(user.role, industryCategory);

  const accessLevel = {
    userId: user.userId,
    role: user.role,
    professionalLevel: professionalLevel.level,
    industryCategory: industryCategory,
    permissions: user.permissions || [],
    accessModules: accessModules,
    dataAccessLevel: getDataAccessLevel(user.role),
  };

  return res.status(200).json(
    new apiResponse(200, accessLevel, "User access level fetched successfully")
  );
});

// Helper to get access modules based on role and industry
function getAccessModules(role, industry) {
  const baseModules = {
    PROFILE: true,
    DASHBOARD: true,
    REPORTS: false,
    ANALYTICS: false,
    EXPORT: false,
    API_ACCESS: false,
  };

  const roleSpecificModules = {
    enterprise_admin: {
      ...baseModules,
      REPORTS: true,
      ANALYTICS: true,
      EXPORT: true,
      API_ACCESS: true,
      USER_MANAGEMENT: true,
      ORGANIZATION_SETTINGS: true,
      AUDIT_LOG: true,
    },
    super_admin: {
      ...baseModules,
      REPORTS: true,
      ANALYTICS: true,
      EXPORT: true,
      API_ACCESS: true,
      USER_MANAGEMENT: true,
      AUDIT_LOG: true,
    },
    admin: {
      ...baseModules,
      REPORTS: true,
      ANALYTICS: true,
      EXPORT: true,
      USER_MANAGEMENT: true,
    },
    user: {
      ...baseModules,
    },
  };

  return roleSpecificModules[role] || baseModules;
}

// Helper to get data access level based on role
function getDataAccessLevel(role) {
  const dataAccessMap = {
    enterprise_admin: {
      level: "FULL_ACCESS",
      canViewAllUsers: true,
      canViewAllData: true,
      canExportData: true,
      canModifySystemSettings: true,
    },
    super_admin: {
      level: "FULL_ACCESS",
      canViewAllUsers: true,
      canViewAllData: true,
      canExportData: true,
      canModifySystemSettings: false,
    },
    admin: {
      level: "ORGANIZATION_ACCESS",
      canViewAllUsers: true,
      canViewAllData: true,
      canExportData: true,
      canModifySystemSettings: false,
    },
    user: {
      level: "LIMITED_ACCESS",
      canViewAllUsers: false,
      canViewAllData: false,
      canExportData: false,
      canModifySystemSettings: false,
    },
  };

  return dataAccessMap[role] || dataAccessMap.user;
}

export {
  getCurrentUser,
  getUserProfile,
  getUsersByProfessionalLevel,
  getUsersByIndustry,
  getUserAccessLevel,
};
