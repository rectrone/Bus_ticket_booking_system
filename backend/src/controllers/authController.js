import { sendSuccess, sendError } from '../utils/response.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { registerUser, loginUser, refreshAccessToken, logoutUser, getUserById } from '../services/authService.js';

/**
 * POST /auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  const result = await registerUser(email, password, firstName, lastName, phone);

  sendSuccess(res, result, 'Registration successful', 201);
});

/**
 * POST /auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await loginUser(email, password);

  sendSuccess(res, result, 'Login successful');
});

/**
 * POST /auth/refresh
 */
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await refreshAccessToken(refreshToken);

  sendSuccess(res, result, 'Token refreshed');
});

/**
 * POST /auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await logoutUser(refreshToken);

  sendSuccess(res, result, 'Logged out successfully');
});

/**
 * GET /auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.userId);

  sendSuccess(res, user, 'User profile retrieved');
});
