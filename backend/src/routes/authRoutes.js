import express from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
} from '../controllers/authController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateRequest, registerSchema, loginSchema, refreshTokenSchema } from '../validators/index.js';

const router = express.Router();

/**
 * POST /auth/register
 * Public - Register new user
 */
router.post('/register', validateRequest(registerSchema), register);

/**
 * POST /auth/login
 * Public - Login user
 */
router.post('/login', validateRequest(loginSchema), login);

/**
 * POST /auth/refresh
 * Public - Refresh access token
 */
router.post('/refresh', validateRequest(refreshTokenSchema), refresh);

/**
 * POST /auth/logout
 * Protected - Logout user
 */
router.post('/logout', authenticate, logout);

/**
 * GET /auth/me
 * Protected - Get current user profile
 */
router.get('/me', authenticate, getMe);

export default router;
