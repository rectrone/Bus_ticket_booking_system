import { PrismaClient } from '@prisma/client';
import { generatePNR } from '../utils/token.js';
import { processPayment } from '../utils/payment.js';
import { sendBookingConfirmationEmail, sendCancellationEmail } from '../utils/email.js';
import { AppError } from '../utils/response.js';
import { config } from '../config/index.js';

const prisma = new PrismaClient();

/**
 * Seat booking with row-level locking
 * 
 * This service uses PostgreSQL's SELECT ... FOR UPDATE to prevent race conditions
 * when multiple users try to book the same seats simultaneously.
 * 
 * Flow:
 * 1. Start transaction
 * 2. Lock seats using FOR UPDATE
 * 3. Verify seat availability
 * 4. Create booking and booking_seats
 * 5. Update seat status to LOCKED
 * 6. Commit transaction
 * 7. Process payment
 * 8. Update booking status to CONFIRMED or FAILED based on payment
 */

export const createBooking = async (
  userId,
  scheduleId,
  seatIds,
  passengerName,
  passengerEmail,
  passengerPhone
) => {
  // Validate max seats per booking
  if (seatIds.length > config.booking.maxSeatsPerBooking) {
    throw new AppError(
      `Maximum ${config.booking.maxSeatsPerBooking} seats allowed per booking`,
      400
    );
  }

  let booking = null;
  let bookingSeats = [];

  try {
    // TRANSACTION: Seat locking and booking creation
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Step 1: Fetch and lock seats using FOR UPDATE
      // This prevents other transactions from modifying these rows
      const seatsToBook = await tx.$queryRaw`
        SELECT id, "seatNumber", status, "scheduleId"
        FROM "Seat"
        WHERE id = ANY(${seatIds}::text[])
        FOR UPDATE
      `;

      // Step 2: Verify all seats exist and belong to the same schedule
      if (seatsToBook.length !== seatIds.length) {
        throw new AppError('One or more seats not found', 404);
      }

      const scheduleIdCheck = seatsToBook[0].scheduleId;
      if (!seatsToBook.every(s => s.scheduleId === scheduleIdCheck)) {
        throw new AppError('All seats must be from the same schedule', 400);
      }

      if (scheduleIdCheck !== scheduleId) {
        throw new AppError('Seats do not belong to the requested schedule', 400);
      }

      // Step 3: Verify seats are available
      const unavailableSeats = seatsToBook.filter(s => s.status !== 'AVAILABLE');
      if (unavailableSeats.length > 0) {
        throw new AppError(
          `Seats ${unavailableSeats.map(s => s.seatNumber).join(', ')} are not available`,
          409
        );
      }

      // Step 4: Fetch schedule with fare info
      const schedule = await tx.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          route: true,
          bus: true,
        },
      });

      if (!schedule) {
        throw new AppError('Schedule not found', 404);
      }

      // Check if schedule is in the past
      if (new Date(schedule.departureTime) < new Date()) {
        throw new AppError('Cannot book for past schedules', 400);
      }

      // Step 5: Calculate total fare
      const totalFare = schedule.fare * seatIds.length;

      // Step 6: Create booking with PENDING status
      booking = await tx.booking.create({
        data: {
          pnr: generatePNR(),
          userId,
          scheduleId,
          passengerName,
          passengerEmail,
          passengerPhone,
          totalFare,
          bookingStatus: 'PENDING',
        },
        include: {
          schedule: {
            include: {
              route: true,
              bus: true,
            },
          },
        },
      });

      // Step 7: Create booking_seats entries
      bookingSeats = await Promise.all(
        seatIds.map(seatId =>
          tx.bookingSeat.create({
            data: {
              bookingId: booking.id,
              seatId,
            },
          })
        )
      );

      // Step 8: Lock seats (update status to LOCKED)
      // Seats will be released if payment fails
      await tx.$executeRawUnsafe(
        `UPDATE "Seat" SET status = $1::"SeatStatus", "updatedAt" = $2 WHERE id = ANY($3::text[])`,
        'LOCKED',
        new Date(),
        seatIds
      );

      // Step 9: Update schedule available seats
      await tx.schedule.update({
        where: { id: scheduleId },
        data: {
          availableSeats: {
            decrement: seatIds.length,
          },
        },
      });

      return { booking, bookingSeats };
    });

    booking = transactionResult.booking;
    bookingSeats = transactionResult.bookingSeats;

    // Step 10: Process payment (OUTSIDE transaction)
    try {
      const paymentResult = await processPayment(booking);

      // Step 11: Create payment record
      await prisma.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.totalFare,
          transactionId: paymentResult.transactionId,
          paymentStatus: paymentResult.success ? 'SUCCESS' : 'FAILED',
        },
      });

      if (paymentResult.success) {
        // Payment succeeded: Confirm booking and mark seats as BOOKED
        booking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            bookingStatus: 'CONFIRMED',
          },
          include: {
            schedule: {
              include: {
                route: true,
                bus: true,
              },
            },
          },
        });

        // Update seat status to BOOKED
        await prisma.seat.updateMany({
          where: { id: { in: seatIds } },
          data: {
            status: 'BOOKED',
          },
        });

        // Send confirmation email
        await sendBookingConfirmationEmail(booking);

        return booking;
      } else {
        // Payment failed: Mark booking as FAILED and release seats
        await releaseSeatsByBookingId(booking.id, scheduleId);

        booking = await prisma.booking.update({
          where: { id: booking.id },
          data: {
            bookingStatus: 'FAILED',
          },
        });

        throw new AppError('Payment processing failed. Seats released.', 402);
      }
    } catch (paymentError) {
      // Payment error: Release seats and mark booking as FAILED
      if (booking) {
        await releaseSeatsByBookingId(booking.id, scheduleId);

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            bookingStatus: 'FAILED',
          },
        });
      }

      throw new AppError(
        paymentError.message || 'Payment processing failed',
        paymentError.statusCode || 500
      );
    }
  } catch (error) {
    // Ensure seats are released on any error
    if (booking && booking.id) {
      try {
        await releaseSeatsByBookingId(booking.id, scheduleId);
      } catch (releaseError) {
        console.error('[RELEASE ERROR]:', releaseError);
      }
    }

    throw error;
  }
};

/**
 * Release locked/booked seats back to AVAILABLE
 */
export const releaseSeatsByBookingId = async (bookingId, scheduleId) => {
  return await prisma.$transaction(async (tx) => {
    // Get seat IDs from booking
    const bookingSeats = await tx.bookingSeat.findMany({
      where: { bookingId },
      include: { seat: true },
    });

    const seatIds = bookingSeats.map(bs => bs.seatId);

    if (seatIds.length === 0) {
      return;
    }

    // Release seats
    await tx.seat.updateMany({
      where: { id: { in: seatIds } },
      data: {
        status: 'AVAILABLE',
      },
    });

    // Increment available seats
    await tx.schedule.update({
      where: { id: scheduleId },
      data: {
        availableSeats: {
          increment: seatIds.length,
        },
      },
    });
  });
};

/**
 * Cancel booking
 */
export const cancelBooking = async (bookingId, userId) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      schedule: {
        include: {
          route: true,
          bus: true,
        },
      },
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Verify ownership
  if (booking.userId !== userId) {
    throw new AppError('You can only cancel your own bookings', 403);
  }

  // Cannot cancel confirmed or already cancelled bookings
  if (booking.bookingStatus === 'CANCELLED') {
    throw new AppError('Booking already cancelled', 400);
  }

  if (booking.bookingStatus === 'CONFIRMED') {
    // Check if departure is > 24 hours away
    const hoursUntilDeparture =
      (new Date(booking.schedule.departureTime) - new Date()) / (1000 * 60 * 60);

    if (hoursUntilDeparture < 24) {
      throw new AppError('Cannot cancel within 24 hours of departure', 400);
    }
  }

  // Release seats and update booking
  await releaseSeatsByBookingId(bookingId, booking.scheduleId);

  const updatedBooking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingStatus: 'CANCELLED',
    },
    include: {
      schedule: {
        include: {
          route: true,
          bus: true,
        },
      },
    },
  });

  // Send cancellation email
  await sendCancellationEmail(updatedBooking);

  return updatedBooking;
};

/**
 * Get booking by PNR
 */
export const getBookingByPNR = async (pnr, userId) => {
  const booking = await prisma.booking.findUnique({
    where: { pnr },
    include: {
      bookingSeats: {
        include: {
          seat: true,
        },
      },
      schedule: {
        include: {
          route: true,
          bus: true,
        },
      },
      payment: true,
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404);
  }

  // Verify ownership
  if (booking.userId !== userId) {
    throw new AppError('Unauthorized access', 403);
  }

  return booking;
};

/**
 * Get user's booking history
 */
export const getUserBookings = async (userId, limit = 10, offset = 0) => {
  const bookings = await prisma.booking.findMany({
    where: { userId },
    include: {
      schedule: {
        include: {
          route: true,
          bus: true,
        },
      },
      bookingSeats: {
        include: {
          seat: true,
        },
      },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return bookings;
};

/**
 * Search available buses
 */
export const searchBuses = async (
  sourceCity,
  destCity,
  travelDate,
  busType = null,
  maxPrice = null
) => {
  // Parse travel date
  const startOfDay = new Date(travelDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(travelDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Build where clause for schedule
  const scheduleWhere = {
    departureTime: {
      gte: startOfDay,
      lte: endOfDay,
    },
    route: {
      sourceCity: sourceCity.toLowerCase(),
      destCity: destCity.toLowerCase(),
    },
    availableSeats: { gt: 0 },
  };

  if (maxPrice) {
    scheduleWhere.fare = { lte: maxPrice };
  }

  // Build where clause for bus
  const busWhere = {};
  if (busType) {
    busWhere.type = busType;
  }

  const schedules = await prisma.schedule.findMany({
    where: scheduleWhere,
    include: {
      bus: true,
      route: true,
      seats: {
        where: { status: 'AVAILABLE' },
      },
    },
    orderBy: { fare: 'asc' },
  });

  // Apply bus type filter if specified
  let results = schedules;
  if (busType) {
    results = schedules.filter(s => s.bus.type === busType);
  }

  return results;
};
