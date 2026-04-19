import {
  createBus,
  getAllBuses,
  createRoute,
  createRouteSchedule,
  getAllRoutes,
  createSchedule,
  getSchedules,
  getScheduleDetails,
} from '../services/adminService.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

/**
 * POST /admin/buses
 * Create a new bus
 */
export const addBus = asyncHandler(async (req, res) => {
  const { busNumber, type, totalSeats, manufacturer, registrationNum } = req.body;

  const bus = await createBus(busNumber, type, totalSeats, manufacturer, registrationNum);

  sendSuccess(res, bus, 'Bus created successfully', 201);
});

/**
 * GET /admin/buses
 * Get all buses
 */
export const listBuses = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  const buses = await getAllBuses(limit, offset);

  sendSuccess(res, buses, 'Buses retrieved');
});

/**
 * POST /admin/routes
 * Create a new route
 */
export const addRoute = asyncHandler(async (req, res) => {
  const { sourceCity, destCity, distance, baseFare } = req.body;

  const route = await createRoute(sourceCity, destCity, distance, baseFare);

  sendSuccess(res, route, 'Route created successfully', 201);
});

/**
 * POST /admin/route-schedules
 * Create a route and schedule together
 */
export const addRouteSchedule = asyncHandler(async (req, res) => {
  const {
    busId,
    sourceCity,
    destCity,
    distance,
    baseFare,
    departureTime,
    arrivalTime,
    fare,
  } = req.body;

  const result = await createRouteSchedule(
    busId,
    sourceCity,
    destCity,
    distance,
    baseFare,
    departureTime,
    arrivalTime,
    fare
  );

  sendSuccess(res, result, 'Route and schedule created successfully', 201);
});

/**
 * GET /admin/routes
 * Get all routes
 */
export const listRoutes = asyncHandler(async (req, res) => {
  const routes = await getAllRoutes();

  sendSuccess(res, routes, 'Routes retrieved');
});

/**
 * POST /admin/schedules
 * Create a new schedule
 */
export const addSchedule = asyncHandler(async (req, res) => {
  const { busId, routeId, departureTime, arrivalTime, fare } = req.body;

  const schedule = await createSchedule(busId, routeId, departureTime, arrivalTime, fare);

  sendSuccess(res, schedule, 'Schedule created successfully', 201);
});

/**
 * GET /admin/schedules
 * Get schedules with filters
 */
export const listSchedules = asyncHandler(async (req, res) => {
  const filter = {
    routeId: req.query.routeId,
    busId: req.query.busId,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    minFare: req.query.minFare ? parseFloat(req.query.minFare) : null,
    maxFare: req.query.maxFare ? parseFloat(req.query.maxFare) : null,
  };

  const schedules = await getSchedules(filter);

  sendSuccess(res, schedules, 'Schedules retrieved');
});

/**
 * GET /admin/schedules/:scheduleId
 * Get schedule details
 */
export const getSchedule = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;

  const schedule = await getScheduleDetails(scheduleId);

  sendSuccess(res, schedule, 'Schedule details retrieved');
});

/**
 * GET /admin/bookings
 * Get all bookings (admin view)
 */
export const getAllBookings = asyncHandler(async (req, res) => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const bookings = await prisma.booking.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      schedule: {
        include: {
          bus: true,
          route: true,
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
  });

  sendSuccess(res, bookings, 'All bookings retrieved');
});
