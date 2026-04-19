import {
  createBooking,
  cancelBooking,
  getBookingByPNR,
  getUserBookings,
  searchBuses,
} from '../services/bookingService.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

/**
 * POST /bookings/search
 * Search for available buses
 */
export const searchBusses = asyncHandler(async (req, res) => {
  const { sourceCity, destCity, travelDate, busType, maxPrice } = req.body;

  const buses = await searchBuses(sourceCity, destCity, travelDate, busType, maxPrice);

  sendSuccess(res, buses, 'Buses found');
});

/**
 * POST /bookings
 * Create a new booking
 */
export const createNewBooking = asyncHandler(async (req, res) => {
  const { scheduleId, seatIds, passengerName, passengerEmail, passengerPhone } = req.body;

  const booking = await createBooking(
    req.user.userId,
    scheduleId,
    seatIds,
    passengerName,
    passengerEmail,
    passengerPhone
  );

  sendSuccess(res, booking, 'Booking confirmed', 201);
});

/**
 * GET /bookings/history
 * Get user's booking history
 */
export const getHistory = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  const bookings = await getUserBookings(req.user.userId, limit, offset);

  sendSuccess(res, bookings, 'Booking history retrieved');
});

/**
 * GET /bookings/:pnr
 * Get booking details by PNR
 */
export const getByPnr = asyncHandler(async (req, res) => {
  const { pnr } = req.params;

  const booking = await getBookingByPNR(pnr, req.user.userId);

  sendSuccess(res, booking, 'Booking details retrieved');
});

/**
 * POST /bookings/:bookingId/cancel
 * Cancel a booking
 */
export const cancelUserBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await cancelBooking(bookingId, req.user.userId);

  sendSuccess(res, booking, 'Booking cancelled successfully');
});
