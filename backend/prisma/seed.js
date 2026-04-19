/**
 * Seed Script - Initialize database with sample data
 * Usage: node prisma/seed.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin users
  const adminUser1 = await prisma.user.create({
    data: {
      email: 'admin@busbooking.com',
      password: '$2b$10$iUXPweC981.IYmjd4IYuFePonIkX1hnGxza93oGkja88RSAXLvdVa',
      firstName: 'Admin',
      lastName: 'User',
      phone: '1234567890',
      role: 'ADMIN',
    },
  });

  const adminUser2 = await prisma.user.create({
    data: {
      email: 'admin2@busbooking.com',
      password: '$2b$10$iUXPweC981.IYmjd4IYuFePonIkX1hnGxza93oGkja88RSAXLvdVa',
      firstName: 'Admin',
      lastName: 'Two',
      phone: '1234567891',
      role: 'ADMIN',
    },
  });

  const adminUser3 = await prisma.user.create({
    data: {
      email: 'superadmin@busbooking.com',
      password: '$2b$10$iUXPweC981.IYmjd4IYuFePonIkX1hnGxza93oGkja88RSAXLvdVa',
      firstName: 'Super',
      lastName: 'Admin',
      phone: '1234567892',
      role: 'ADMIN',
    },
  });

  console.log('✅ Admin users created:', [adminUser1.email, adminUser2.email, adminUser3.email]);

  // Create test passenger
  const passengerUser = await prisma.user.create({
    data: {
      email: 'passenger@example.com',
      password: '$2b$10$iUXPweC981.IYmjd4IYuFePonIkX1hnGxza93oGkja88RSAXLvdVa',
      firstName: 'John',
      lastName: 'Doe',
      phone: '9876543210',
      role: 'PASSENGER',
    },
  });
  console.log('✅ Passenger user created:', passengerUser.email);

  // Create buses
  const bus1 = await prisma.bus.create({
    data: {
      busNumber: 'BUS001',
      type: 'SLEEPER',
      totalSeats: 42,
      manufacturer: 'Volvo',
      registrationNum: 'MH01AB1234',
    },
  });

  const bus2 = await prisma.bus.create({
    data: {
      busNumber: 'BUS002',
      type: 'COMFORT',
      totalSeats: 50,
      manufacturer: 'Mercedes',
      registrationNum: 'MH01AB1235',
    },
  });

  const bus3 = await prisma.bus.create({
    data: {
      busNumber: 'BUS003',
      type: 'ECONOMY',
      totalSeats: 60,
      manufacturer: 'Tata',
      registrationNum: 'MH01AB1236',
    },
  });

  console.log('✅ Buses created:', [bus1.busNumber, bus2.busNumber, bus3.busNumber]);

  // Create routes
  const route1 = await prisma.route.create({
    data: {
      sourceCity: 'mumbai',
      destCity: 'delhi',
      distance: 1400,
      baseFare: 1200,
    },
  });

  const route2 = await prisma.route.create({
    data: {
      sourceCity: 'mumbai',
      destCity: 'bangalore',
      distance: 840,
      baseFare: 800,
    },
  });

  const route3 = await prisma.route.create({
    data: {
      sourceCity: 'delhi',
      destCity: 'jaipur',
      distance: 270,
      baseFare: 400,
    },
  });

  console.log('✅ Routes created');

  // Create schedules for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(22, 0, 0, 0);

  const schedule1 = await prisma.schedule.create({
    data: {
      busId: bus1.id,
      routeId: route1.id,
      departureTime: tomorrow,
      arrivalTime: new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000),
      availableSeats: bus1.totalSeats,
      fare: 1500,
    },
    include: {
      bus: true,
      route: true,
    },
  });

  // Auto-generate seats for schedule
  const seats = [];
  for (let i = 1; i <= bus1.totalSeats; i++) {
    seats.push({
      busId: bus1.id,
      scheduleId: schedule1.id,
      seatNumber: `${Math.ceil(i / 2)}-${i % 2 === 1 ? 'A' : 'B'}`,
      status: 'AVAILABLE',
    });
  }
  await prisma.seat.createMany({ data: seats });

  const schedule2 = await prisma.schedule.create({
    data: {
      busId: bus2.id,
      routeId: route2.id,
      departureTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
      arrivalTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
      availableSeats: bus2.totalSeats,
      fare: 1000,
    },
    include: {
      bus: true,
      route: true,
    },
  });

  // Auto-generate seats for schedule 2
  const seats2 = [];
  for (let i = 1; i <= bus2.totalSeats; i++) {
    seats2.push({
      busId: bus2.id,
      scheduleId: schedule2.id,
      seatNumber: `${Math.ceil(i / 2)}-${i % 2 === 1 ? 'A' : 'B'}`,
      status: 'AVAILABLE',
    });
  }
  await prisma.seat.createMany({ data: seats2 });

  console.log('✅ Schedules and seats created');

  console.log('\n✨ Database seeded successfully!\n');
  console.log('Test Credentials:');
  console.log('  Admin:     admin@busbooking.com / password');
  console.log('  Admin:     admin2@busbooking.com / password');
  console.log('  Admin:     superadmin@busbooking.com / password');
  console.log('  Passenger: passenger@example.com / password');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  });
