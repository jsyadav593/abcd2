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
  const { page: rawPage, limit: rawLimit, skip: rawSkip, offset: rawOffset } = req.query;

  // Sanitize page
  const page = Math.max(1, parseInt(rawPage) || 1);
  const maxPage = page > 1000000 ? 1000000 : page;

  // Sanitize limit
  const limit = Math.min(100, Math.max(1, parseInt(rawLimit) || 10));

  // Sanitize skip/offset
  const skip = Math.max(0, parseInt(rawSkip) || 0);
  const offset = Math.max(0, parseInt(rawOffset) || 0);

  // Store sanitized values on req object without modifying req.query
  req.sanitizedQuery = {
    page: maxPage,
    limit,
    skip,
    offset,
  };

  next();
};
