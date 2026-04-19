# College Project Explanation Guide

## Project Title

Bus Booking System

## 1. Project Idea

This project is a full-stack bus booking system. It allows normal users to search buses, select seats, make bookings, check booking history, and cancel bookings. It also includes an admin panel where an admin can add buses, create routes, create schedules, and manage booking-related data.

The main goal of the project is to show how a real booking system works from both the user side and the admin side.

## 2. Main Problem the Project Solves

In a manual booking system, handling buses, routes, seat availability, and bookings becomes difficult. There can also be problems like:

- double booking of the same seat
- poor tracking of schedules
- difficulty in managing booking records
- no clear separation between user and admin operations

This project solves those problems by using a database-backed system with proper validation, authentication, and seat locking during booking.

## 3. Technologies Used

### Frontend

- React
- Vite
- React Router
- React Hook Form
- Zod
- Tailwind CSS
- Axios

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT authentication
- Zod validation

## 4. Project Structure

The project is divided into two main parts:

- `frontend` for the user interface
- `backend` for API, business logic, and database access

Important folders:

- `frontend/src/pages` contains full pages like home, login, admin, booking history
- `frontend/src/components` contains reusable UI components
- `frontend/src/services` contains API call functions
- `backend/src/routes` contains API route definitions
- `backend/src/controllers` receives requests and sends responses
- `backend/src/services` contains the actual business logic
- `backend/src/validators` contains request validation rules
- `backend/prisma/schema.prisma` defines database models

## 5. Step-by-Step Development Explanation

This section explains the project in the same order a developer would usually build it.

### Step 1: Define the System Requirements

First, the system requirements were identified:

- users should be able to register and log in
- users should be able to search available buses
- users should be able to book seats
- users should be able to cancel bookings
- admins should be able to manage buses, routes, and schedules

This step is important because it decides what modules and database tables are needed.

### Step 2: Design the Database

The database was designed in `backend/prisma/schema.prisma`.

Main models:

- `User`
- `RefreshToken`
- `Bus`
- `Route`
- `Schedule`
- `Seat`
- `Booking`
- `BookingSeat`
- `Payment`

Why these tables are needed:

- `User` stores account information
- `Bus` stores bus details like bus number, type, and total seats
- `Route` stores source city, destination city, distance, and base fare
- `Schedule` connects a bus to a route for a specific date and time
- `Seat` stores seat records for every schedule
- `Booking` stores the main booking details
- `BookingSeat` connects bookings and seats
- `Payment` stores payment result

This design makes the system normalized and easier to manage.

### Step 3: Build the Backend Server

The backend entry point is `backend/src/server.js`.

This file does the following:

- creates the Express app
- enables security middleware like Helmet
- enables CORS
- enables rate limiting
- enables JSON body parsing
- registers route files
- adds error handling

In simple words, this file starts the backend and connects all parts together.

### Step 4: Create Authentication Module

Authentication is handled using:

- `backend/src/routes/authRoutes.js`
- `backend/src/controllers/authController.js`
- `backend/src/services/authService.js`
- `backend/src/utils/token.js`

Flow of authentication:

1. user sends register or login request
2. route forwards request to controller
3. controller calls service
4. service checks database and creates tokens
5. response is sent back to frontend

Important points:

- passwords are hashed before storing
- JWT tokens are used for login sessions
- refresh tokens are stored separately

This makes the login system more secure and structured.

### Step 5: Add Validation

Validation is written in `backend/src/validators/index.js`.

This file checks request bodies before they reach the business logic.

Examples:

- email must be valid
- phone number must be 10 digits
- fare must be positive
- bus type must be one of the allowed enum values

This reduces invalid data and prevents many backend errors.

### Step 6: Add Authentication and Authorization Middleware

This is handled in `backend/src/middlewares/authMiddleware.js`.

There are two main jobs here:

- `authenticate` checks whether the token is valid
- `authorize` checks whether the user has the correct role, such as `ADMIN`

This is how the system separates normal users from admin users.

### Step 7: Build Booking Logic

Booking is the most important module in this project.

Main files:

- `backend/src/routes/bookingRoutes.js`
- `backend/src/controllers/bookingController.js`
- `backend/src/services/bookingService.js`

The booking service handles:

- bus search
- booking creation
- booking history
- booking by PNR
- cancellation

### Step 8: Prevent Double Booking

One of the most important parts of this project is seat locking.

If two people try to book the same seat at the same time, the system should not allow both bookings. To solve this, PostgreSQL row locking is used in `bookingService.js`.

The booking flow is:

1. selected seats are fetched from database
2. the rows are locked using `SELECT ... FOR UPDATE`
3. availability is checked
4. booking record is created
5. booking-seat records are created
6. seat status is changed to `LOCKED`
7. payment is processed
8. if payment succeeds, seat status becomes `BOOKED`
9. if payment fails, seats are released again

This makes the project technically stronger because it handles concurrency properly.

### Step 9: Build Admin Module

Admin features are handled by:

- `backend/src/routes/adminRoutes.js`
- `backend/src/controllers/adminController.js`
- `backend/src/services/adminService.js`

Admin can:

- add buses
- list buses
- create routes
- list routes
- create schedules
- list schedules
- get schedule details
- list all bookings

There is also a combined admin endpoint:

- `POST /admin/route-schedules`

This endpoint creates the route and schedule together in one request. It was added to make the admin workflow simpler and more practical.

### Step 10: Build the Frontend Pages

The frontend is built using React.

Main pages include:

- `Home.jsx`
- `Login.jsx`
- `Register.jsx`
- `BookingPage.jsx`
- `BookingHistory.jsx`
- `Admin.jsx`

What each page does:

- `Home.jsx` shows the search section and search results
- `Login.jsx` handles user login
- `Register.jsx` handles new user registration
- `BookingPage.jsx` shows seats and booking form
- `BookingHistory.jsx` shows previous bookings
- `Admin.jsx` provides admin management forms

### Step 11: Connect Frontend with Backend

API calls are organized in `frontend/src/services/bookingService.js` and `frontend/src/services/api.js`.

Why this structure was used:

- API logic stays separate from UI code
- components remain cleaner
- token handling becomes easier

For example:

- login page calls auth service
- booking page calls booking service
- admin page calls admin service

This follows good separation of concerns.

### Step 12: Manage User Session on Frontend

Frontend authentication state is managed through context.

This allows the application to:

- store logged-in user info
- protect routes
- redirect users if they are not allowed
- show admin page only to admin users

This is important for both security and user experience.

### Step 13: Build the Admin Panel Flow

The admin panel originally had separate actions for route creation and schedule creation. Later, this was improved so one form can create both together for one bus.

Why this change is useful:

- fewer steps for admin
- better user experience
- more practical data entry
- route and schedule can be created in one action

The backend supports this through a combined route-schedule creation endpoint.

### Step 14: Handle Errors Properly

Error handling is managed centrally in:

- `backend/src/middlewares/errorHandler.js`
- `backend/src/utils/response.js`

This means the API returns consistent error responses instead of random server messages.

Typical error cases handled:

- invalid login
- duplicate route
- duplicate schedule
- seat already booked
- invalid dates
- unauthorized access

This makes the project easier to debug and easier to present.

## 6. Important Backend Files Explained

### `server.js`

Starts the application and registers middleware and routes.

### `authRoutes.js`

Defines authentication endpoints like register, login, logout, refresh, and profile.

### `bookingRoutes.js`

Defines endpoints for search, booking creation, history, PNR lookup, and cancellation.

### `adminRoutes.js`

Defines admin-only endpoints for managing buses, routes, schedules, and bookings.

### `authController.js`

Handles incoming auth requests and sends proper API responses.

### `bookingController.js`

Receives booking-related requests and calls booking service methods.

### `adminController.js`

Receives admin requests and connects them with admin service methods.

### `authService.js`

Contains actual auth logic like password comparison and token creation.

### `bookingService.js`

Contains the most important logic of the system, especially seat booking and cancellation.

### `adminService.js`

Contains admin-side business logic like adding buses, routes, schedules, and combined route-schedule creation.

### `schema.prisma`

Defines the full database structure and model relations.

## 7. Important Frontend Files Explained

### `App.jsx`

Defines frontend routes and protected routes.

### `ProtectedRoute.jsx`

Prevents unauthorized users from opening protected pages.

### `Home.jsx`

Shows search UI and search results.

### `BookingPage.jsx`

Lets the user choose seats and confirm booking.

### `BookingHistory.jsx`

Displays old bookings and cancellation options.

### `Admin.jsx`

Allows admin users to create route and schedule information and manage data.

### `bookingService.js`

Contains frontend API helper methods for auth, booking, and admin calls.

## 8. End-to-End User Flow

### Passenger Flow

1. user registers or logs in
2. user searches buses
3. matching schedules are shown
4. user opens a schedule
5. user selects seats
6. booking request goes to backend
7. backend locks seats and processes booking
8. booking is confirmed
9. user can see booking history later

### Admin Flow

1. admin logs in
2. admin opens admin panel
3. admin selects a bus
4. admin enters route details
5. admin enters schedule details
6. backend creates route and schedule
7. seats are generated automatically for that schedule

## 9. Why This Project Is Good for a College Project

This project is a strong college project because it includes:

- frontend and backend integration
- authentication and authorization
- database design
- API creation
- admin and user roles
- validation
- concurrency handling in booking
- realistic business logic

It is not just a static website. It demonstrates full-stack development and database-driven workflow.

## 10. Key Technical Highlight

If someone asks for the most important technical point in the project, the best answer is:

The main technical highlight is the seat booking system, where the application locks seat rows in the database during booking so that two users cannot book the same seat at the same time.

This shows that the project handles real-world booking logic instead of only simple form submission.

## 11. How to Explain the Project in Viva

You can explain it in this order:

1. start with the project goal
2. explain user and admin roles
3. explain database tables and relationships
4. explain backend structure using route, controller, service pattern
5. explain frontend pages and API integration
6. explain the booking flow
7. explain how double booking is prevented
8. explain admin route and schedule creation

Simple viva summary:

"This project is a bus booking system with both passenger and admin modules. Users can search buses, choose seats, and make bookings. Admin can manage buses, routes, and schedules. I used React for frontend, Express and Node.js for backend, PostgreSQL for database, Prisma for ORM, JWT for authentication, and validation middleware for safe requests. The most important part is the booking flow, where seat rows are locked during booking to prevent double booking."

## 12. Common Questions and Answers

### Why did you use Prisma?

Prisma makes database access easier and safer. It also keeps schema and queries organized.

### Why did you use PostgreSQL?

PostgreSQL is reliable, supports relations well, and is good for transaction-based systems like bookings.

### Why did you use JWT?

JWT is useful for stateless authentication between frontend and backend.

### Why did you separate controller and service?

This keeps the code clean. Controllers handle HTTP request and response, while services handle business logic.

### How is double booking prevented?

By locking selected seat rows inside a transaction before finalizing the booking.

### Why is there a `BookingSeat` table?

Because one booking can have multiple seats, and this needs a proper relation table.

### Why did you generate seats per schedule?

Because seat availability depends on each bus trip, not just on the bus itself.

## 13. Final Conclusion

This project demonstrates a complete bus booking workflow with proper frontend, backend, database, authentication, admin controls, and booking safety logic. It is a practical example of full-stack development and can be explained confidently by focusing on the modules, data flow, and seat-locking logic.
