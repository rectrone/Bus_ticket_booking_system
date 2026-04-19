import { sendError, AppError } from '../utils/response.js';

/**
 * Centralized Error Handling Middleware
 * Must be the last middleware in the app
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  // Prisma validation error
  if (err.name === 'PrismaClientValidationError') {
    return sendError(res, 'Database validation error', 400, {
      details: err.message,
    });
  }

  // Prisma unique constraint error
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return sendError(res, `${field} already exists`, 409, {
      field,
    });
  }

  // Custom AppError
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Default error
  sendError(res, err.message || 'Internal server error', 500);
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
