import { apiError } from '../utils/apiError.js';

/**
 * Validation middleware - validates request against schema
 * @param {Joi.Schema} schema - Joi schema object
 * @param {string} location - 'body', 'query', or 'params'
 */
export const validate = (schema, location = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[location];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      throw new apiError(400, 'Validation failed', messages);
    }

    req[location] = value;
    next();
  };
};

/**
 * Safe query parameter validation
 * Prevents negative values, excessive limits, etc.
 */
export const sanitizeQueryParams = (req, res, next) => {
  let { page, limit, skip, offset } = req.query;

  // Sanitize page
  page = Math.max(1, parseInt(page) || 1);
  if (page > 1000000) page = 1000000; // Max sensible page

  // Sanitize limit
  limit = Math.min(100, Math.max(1, parseInt(limit) || 10));

  // Sanitize skip/offset
  skip = Math.max(0, parseInt(skip) || 0);
  offset = Math.max(0, parseInt(offset) || 0);

  req.query = {
    ...req.query,
    page,
    limit,
    skip,
    offset,
  };

  next();
};
