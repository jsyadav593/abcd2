import Joi from 'joi';

/**
 * User Creation Validation Schema
 * All required fields for creating a new user
 */
export const createUserSchema = Joi.object({
  userId: Joi.string()
    .alphanum()
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'User ID must be alphanumeric',
      'string.max': 'User ID cannot exceed 50 characters',
      'any.required': 'User ID is required',
    }),

  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Name must be at least 3 characters',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email must be a valid email',
      'any.required': 'Email is required',
    }),

  phone_no: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.positive': 'Phone number must be positive',
    }),

  designation: Joi.string()
    .trim()
    .max(100)
    .optional(),

  department: Joi.string()
    .trim()
    .max(100)
    .optional(),

  role: Joi.string()
    .valid('enterprise_admin', 'super_admin', 'admin', 'user')
    .required()
    .messages({
      'any.only': 'Invalid role. Must be enterprise_admin, super_admin, admin, or user',
      'any.required': 'Role is required',
    }),

  canLogin: Joi.boolean()
    .optional()
    .default(false),

  isActive: Joi.boolean()
    .optional()
    .default(true),

  isBlocked: Joi.boolean()
    .optional()
    .default(false),

  organizationId: Joi.string()
    .required()
    .messages({
      'any.required': 'Organization ID is required',
    }),

  branchId: Joi.array()
    .items(Joi.string())
    .optional(),

  permissions: Joi.array()
    .items(Joi.string())
    .optional(),

  reportingTo: Joi.string()
    .optional(),

  remarks: Joi.string()
    .max(500)
    .optional(),
});

/**
 * User Update Validation Schema
 * Partial schema - at least one field required
 */
export const updateUserSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .optional(),

  email: Joi.string()
    .email()
    .optional(),

  phone_no: Joi.number()
    .integer()
    .positive()
    .optional(),

  designation: Joi.string()
    .trim()
    .max(100)
    .optional(),

  department: Joi.string()
    .trim()
    .max(100)
    .optional(),

  role: Joi.string()
    .valid('enterprise_admin', 'super_admin', 'admin', 'user')
    .optional(),

  canLogin: Joi.boolean()
    .optional(),

  isActive: Joi.boolean()
    .optional(),

  isBlocked: Joi.boolean()
    .optional(),

  branchId: Joi.array()
    .items(Joi.string())
    .optional(),

  permissions: Joi.array()
    .items(Joi.string())
    .optional(),

  reportingTo: Joi.string()
    .optional(),

  remarks: Joi.string()
    .max(500)
    .optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Toggle Login Validation Schema
 */
export const toggleCanLoginSchema = Joi.object({
  canLogin: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'canLogin must be a boolean',
      'any.required': 'canLogin field is required',
    }),
});

/**
 * Block/Unblock User Validation Schema
 */
export const blockUnblockSchema = Joi.object({
  isBlocked: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'isBlocked must be a boolean',
      'any.required': 'isBlocked field is required',
    }),
});

/**
 * Pagination Validation
 */
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1',
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
});
