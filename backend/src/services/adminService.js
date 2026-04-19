import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/response.js';

const prisma = new PrismaClient();

const normalizeCity = (city) => city.trim().toLowerCase();

const getBusOrThrow = async (tx, busId) => {
  const bus = await tx.bus.findUnique({ where: { id: busId } });

  if (!bus) {
    throw new AppError('Bus not found', 404);
  }

  return bus;
};

const getRouteByCities = async (tx, sourceCity, destCity) => {
  return tx.route.findUnique({
    where: {
      sourceCity_destCity: {
        sourceCity,
        destCity,
      },
    },
  });
};

const validateScheduleTimes = (departureTime, arrivalTime) => {
  const depTime = new Date(departureTime);
  const arrTime = new Date(arrivalTime);

  if (depTime >= arrTime) {
    throw new AppError('Departure time must be before arrival time', 400);
  }

  if (depTime < new Date()) {
    throw new AppError('Cannot create schedule for past dates', 400);
  }

  return { depTime, arrTime };
};

const ensureScheduleDoesNotExist = async (tx, busId, routeId, departureTime) => {
  const existingSchedule = await tx.schedule.findUnique({
    where: {
      busId_routeId_departureTime: {
        busId,
        routeId,
        departureTime,
      },
    },
  });

  if (existingSchedule) {
    throw new AppError('Schedule already exists for this bus, route, and time', 409);
  }
};

const buildSeats = (totalSeats, busId, scheduleId) => {
  const seats = [];

  for (let i = 1; i <= totalSeats; i++) {
    seats.push({
      busId,
      scheduleId,
      seatNumber: `${Math.ceil(i / 2)}-${i % 2 === 1 ? 'A' : 'B'}`,
      status: 'AVAILABLE',
    });
  }

  return seats;
};

const createScheduleWithSeats = async (tx, bus, routeId, depTime, arrTime, fare) => {
  await ensureScheduleDoesNotExist(tx, bus.id, routeId, depTime);

  const schedule = await tx.schedule.create({
    data: {
      busId: bus.id,
      routeId,
      departureTime: depTime,
      arrivalTime: arrTime,
      availableSeats: bus.totalSeats,
      fare,
    },
    include: {
      bus: true,
      route: true,
    },
  });

  await tx.seat.createMany({
    data: buildSeats(bus.totalSeats, bus.id, schedule.id),
  });

  return schedule;
};

/**
 * Create bus
 */
export const createBus = async (busNumber, type, totalSeats, manufacturer, registrationNum) => {
  const existingBus = await prisma.bus.findFirst({
    where: {
      OR: [
        { busNumber },
        { registrationNum },
      ],
    },
  });

  if (existingBus) {
    throw new AppError('Bus with this number or registration already exists', 409);
  }

  const bus = await prisma.bus.create({
    data: {
      busNumber,
      type,
      totalSeats,
      manufacturer,
      registrationNum,
    },
  });

  return bus;
};

/**
 * Get all buses
 */
export const getAllBuses = async (limit = 20, offset = 0) => {
  const buses = await prisma.bus.findMany({
    take: limit,
    skip: offset,
    include: {
      _count: {
        select: { schedules: true },
      },
    },
  });

  return buses;
};

/**
 * Create route
 */
export const createRoute = async (sourceCity, destCity, distance, baseFare) => {
  const normalizedSource = normalizeCity(sourceCity);
  const normalizedDest = normalizeCity(destCity);
  const existingRoute = await getRouteByCities(prisma, normalizedSource, normalizedDest);

  if (existingRoute) {
    throw new AppError('Route already exists', 409);
  }

  const route = await prisma.route.create({
    data: {
      sourceCity: normalizedSource,
      destCity: normalizedDest,
      distance,
      baseFare,
    },
  });

  return route;
};

/**
 * Get all routes
 */
export const getAllRoutes = async () => {
  return await prisma.route.findMany({
    orderBy: { sourceCity: 'asc' },
  });
};

/**
 * Create schedule and associated seats
 */
export const createSchedule = async (busId, routeId, departureTime, arrivalTime, fare) => {
  const { depTime, arrTime } = validateScheduleTimes(departureTime, arrivalTime);

  return prisma.$transaction(async (tx) => {
    const bus = await getBusOrThrow(tx, busId);
    const route = await tx.route.findUnique({ where: { id: routeId } });

    if (!route) {
      throw new AppError('Route not found', 404);
    }

    return createScheduleWithSeats(tx, bus, route.id, depTime, arrTime, fare);
  });
};

/**
 * Create route and schedule together in one transaction
 */
export const createRouteSchedule = async (
  busId,
  sourceCity,
  destCity,
  distance,
  baseFare,
  departureTime,
  arrivalTime,
  fare
) => {
  const normalizedSource = normalizeCity(sourceCity);
  const normalizedDest = normalizeCity(destCity);
  const { depTime, arrTime } = validateScheduleTimes(departureTime, arrivalTime);

  return prisma.$transaction(async (tx) => {
    const bus = await getBusOrThrow(tx, busId);
    let route = await getRouteByCities(tx, normalizedSource, normalizedDest);
    let routeCreated = false;

    if (route) {
      const matchesExistingRoute =
        route.distance === distance && route.baseFare === baseFare;

      if (!matchesExistingRoute) {
        throw new AppError('Route already exists with different distance or base fare', 409);
      }
    } else {
      route = await tx.route.create({
        data: {
          sourceCity: normalizedSource,
          destCity: normalizedDest,
          distance,
          baseFare,
        },
      });
      routeCreated = true;
    }

    const schedule = await createScheduleWithSeats(tx, bus, route.id, depTime, arrTime, fare);

    return {
      routeCreated,
      route,
      schedule,
    };
  });
};

/**
 * Get schedules with filters
 */
export const getSchedules = async (filter = {}) => {
  const where = {};

  if (filter.routeId) {
    where.routeId = filter.routeId;
  }

  if (filter.busId) {
    where.busId = filter.busId;
  }

  if (filter.fromDate && filter.toDate) {
    where.departureTime = {
      gte: new Date(filter.fromDate),
      lte: new Date(filter.toDate),
    };
  }

  if (filter.minFare || filter.maxFare) {
    where.fare = {};
    if (filter.minFare) {
      where.fare.gte = filter.minFare;
    }
    if (filter.maxFare) {
      where.fare.lte = filter.maxFare;
    }
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: {
      bus: true,
      route: true,
      seats: {
        select: {
          id: true,
          seatNumber: true,
          status: true,
        },
      },
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { departureTime: 'asc' },
  });

  return schedules;
};

/**
 * Get schedule details
 */
export const getScheduleDetails = async (scheduleId) => {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: {
      bus: true,
      route: true,
      seats: {
        select: {
          id: true,
          seatNumber: true,
          status: true,
        },
        orderBy: { seatNumber: 'asc' },
      },
    },
  });

  if (!schedule) {
    throw new AppError('Schedule not found', 404);
  }

  return schedule;
};
