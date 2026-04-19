import express from 'express';
import {
  searchBusses,
  createNewBooking,
  getHistory,
  getByPnr,
  cancelUserBooking,
} from '../controllers/bookingController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { validateRequest, createBookingSchema } from '../validators/index.js';

const router = express.Router();

/**
 * POST /bookings/search
 * Public - Search for available buses
 */
router.post('/search', searchBusses);

/**
 * POST /bookings
 * Protected - Create a new booking
 */
router.post('/', authenticate, validateRequest(createBookingSchema), createNewBooking);

/**
 * GET /bookings/history
 * Protected - Get user's booking history
 */
router.get('/history', authenticate, getHistory);

/**
 * GET /bookings/:pnr
 * Protected - Get booking details by PNR
 */
router.get('/:pnr', authenticate, getByPnr);

/**
 * POST /bookings/:bookingId/cancel
 * Protected - Cancel a booking
 */
router.post('/:bookingId/cancel', authenticate, cancelUserBooking);

export default router;
