import express from 'express';
import {
  addBus,
  listBuses,
  addRoute,
  addRouteSchedule,
  listRoutes,
  addSchedule,
  listSchedules,
  getSchedule,
  getAllBookings,
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import {
  validateRequest,
  createBusSchema,
  createRouteSchema,
  createRouteScheduleSchema,
  createScheduleSchema,
} from '../validators/index.js';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * POST /admin/buses
 * Create a new bus
 */
router.post('/buses', validateRequest(createBusSchema), addBus);

/**
 * GET /admin/buses
 * Get all buses
 */
router.get('/buses', listBuses);

/**
 * POST /admin/routes
 * Create a new route
 */
router.post('/routes', validateRequest(createRouteSchema), addRoute);

/**
 * POST /admin/route-schedules
 * Create a route and schedule together
 */
router.post('/route-schedules', validateRequest(createRouteScheduleSchema), addRouteSchedule);

/**
 * GET /admin/routes
 * Get all routes
 */
router.get('/routes', listRoutes);

/**
 * POST /admin/schedules
 * Create a new schedule
 */
router.post('/schedules', validateRequest(createScheduleSchema), addSchedule);

/**
 * GET /admin/schedules
 * Get schedules with filters
 */
router.get('/schedules', listSchedules);

/**
 * GET /admin/schedules/:scheduleId
 * Get schedule details
 */
router.get('/schedules/:scheduleId', getSchedule);

/**
 * GET /admin/bookings
 * Get all bookings
 */
router.get('/bookings', getAllBookings);

export default router;
