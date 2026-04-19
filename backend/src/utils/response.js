/**
 * Standard API Response Format
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard Error Response Format
 */
export const sendError = (res, message = 'Error', statusCode = 500, data = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};

/**
 * Custom Error Class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
