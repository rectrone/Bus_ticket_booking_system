import { z } from 'zod';
import { sendError } from '../utils/response.js';

/**
 * Request Validation Middleware Factory
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const data = schema.parse(req.body);
      req.body = data;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(({path, message}) => ({
          field: path.join('.'),
          message,
        }));
        
        return sendError(res, 'Validation failed', 400, {
          errors: formattedErrors,
        });
      }
      
      sendError(res, 'Validation error', 400);
    }
  };
};

// ============= AUTH VALIDATORS =============

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  phone: z.string().regex(/^\d{10}$/, 'Invalid phone number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

// ============= BOOKING VALIDATORS =============

export const createBookingSchema = z.object({
  scheduleId: z.string().min(1, 'Schedule ID required'),
  seatIds: z.array(z.string()).min(1, 'At least 1 seat required').max(6, 'Maximum 6 seats allowed'),
  passengerName: z.string().min(2, 'Passenger name required'),
  passengerEmail: z.string().email('Invalid email'),
  passengerPhone: z.string().regex(/^\d{10}$/, 'Invalid phone number'),
});

// ============= BUS VALIDATORS =============

export const createBusSchema = z.object({
  busNumber: z.string().min(1, 'Bus number required'),
  type: z.enum(['ECONOMY', 'COMFORT', 'SLEEPER']),
  totalSeats: z.number().int().min(20, 'Minimum 20 seats').max(60, 'Maximum 60 seats'),
  manufacturer: z.string().optional(),
  registrationNum: z.string().min(1, 'Registration number required'),
});

// ============= ROUTE VALIDATORS =============

export const createRouteSchema = z.object({
  sourceCity: z.string().min(2, 'Source city required'),
  destCity: z.string().min(2, 'Destination city required'),
  distance: z.number().int().positive('Distance must be positive'),
  baseFare: z.number().positive('Base fare must be positive'),
});

// ============= SCHEDULE VALIDATORS =============

export const createScheduleSchema = z.object({
  busId: z.string().min(1, 'Bus ID required'),
  routeId: z.string().min(1, 'Route ID required'),
  departureTime: z.string().datetime('Invalid departure time'),
  arrivalTime: z.string().datetime('Invalid arrival time'),
  fare: z.number().positive('Fare must be positive'),
});

export const createRouteScheduleSchema = z.object({
  busId: z.string().min(1, 'Bus ID required'),
  sourceCity: z.string().min(2, 'Source city required'),
  destCity: z.string().min(2, 'Destination city required'),
  distance: z.number().int().positive('Distance must be positive'),
  baseFare: z.number().positive('Base fare must be positive'),
  departureTime: z.string().datetime('Invalid departure time'),
  arrivalTime: z.string().datetime('Invalid arrival time'),
  fare: z.number().positive('Fare must be positive'),
});
