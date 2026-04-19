# Bus Booking System

## Overview

A full-stack bus booking application designed for handling **user bookings, seat management, and admin operations**. Built using a typical modern web architecture with a REST API backend and a React frontend.

---

## Core Functionalities

### Passenger Side
- User registration and login (JWT-based authentication)
- Search buses using route and date
- View available schedules
- Select seats and create bookings
- View booking history
- Cancel bookings (based on rules)

### Admin Side
- Manage buses
- Manage routes and schedules
- View all bookings
- Control system-level operations

---

## System Capabilities

- Authentication & authorization (JWT)
- Role-based access (User / Admin)
- Seat allocation system to prevent double booking
- Booking lifecycle management (create, view, cancel)
- Input validation and error handling
- Optional email notifications
- Payment simulation (mock system)

---

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM

### Frontend
- React (Vite-based setup)
- Routing and form handling
- API communication layer

---

## High-Level Architecture

``` id="gk92p3"
Client (React Frontend)
        ↓
REST API (Express Backend)
        ↓
Database (PostgreSQL)
```

---

## Project Structure (Simplified)

``` id="kz83lm"
backend/
 ├── controllers   → request handling logic
 ├── routes        → API endpoints
 ├── services      → business logic
 ├── middlewares   → auth, validation
 └── prisma        → database schema

frontend/
 ├── components    → reusable UI
 ├── pages         → screens/views
 ├── services      → API calls
 └── context       → state management
```

---

## Key API Groups

``` id="z81xmv"
/api/auth       → authentication
/api/bookings   → booking operations
/api/admin      → admin operations
/api/buses      → bus data
/api/users      → user data
```

---

## Operational Rules

- Public access: bus search
- Auth required: booking, history, cancellation
- Admin-only: management endpoints
- Seat count is auto-generated per schedule
- Booking limits enforced per user

---

## Summary

- Standard **client-server architecture**
- Clean separation of concerns (routes, services, controllers)
- Scalable backend with ORM (Prisma)
- Frontend consumes API via HTTP requests
- Designed for real-world booking workflows with concurrency handling