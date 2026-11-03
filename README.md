# Online Event Registration and Management System (OERMS)

A responsive full-stack campus event platform for publishing events, collecting student registrations, issuing QR tickets, and managing attendance.

## Features implemented in this foundation

- Responsive React + Vite public event discovery experience.
- Express REST API backed by MongoDB/Mongoose.
- Organizer sign-up/sign-in, bcrypt password hashing, JWT authentication.
- Event publishing, editing, public listing, and safe cancellation/deletion.
- Student registration with validation, duplicate email protection per event, and capacity checks.
- Cryptographically random ticket codes and QR code generation.
- Organizer attendee list and single-use check-in API with manual ticket-code entry or camera-based QR scanning.
- Event-owner authorization checks for editing, deleting, attendee listing, and check-in.
- Organizer event management view with registration/check-in status.
- Helmet security headers, configurable CORS, request-size limit, API rate limiting, Zod validation, and centralized API errors.

## Requirements

- Node.js 20+
- npm 10+
- MongoDB local instance or MongoDB Atlas

## Run locally

1. From the repository root, install dependencies: `npm install`.
2. Copy `backend/.env.example` to `backend/.env`.
3. Set `MONGODB_URI` and a private random `JWT_SECRET` of at least 32 characters.
4. Run both applications from the root: `npm run dev`.
5. Open the frontend at http://localhost:5173.
6. API health endpoint: http://localhost:5000/api/health.

Optional frontend API override: create `frontend/.env` with `VITE_API_URL=http://localhost:5000/api`.

## API

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | /api/health | Public | API health |
| POST | /api/auth/register | Public | Organizer account |
| POST | /api/auth/login | Public | Organizer login |
| GET | /api/auth/me | Organizer | Current account |
| GET | /api/events | Public | Published events |
| GET | /api/events/:id | Public | Event details |
| POST | /api/events | Organizer | Create event |
| PATCH | /api/events/:id | Organizer | Update event |
| DELETE | /api/events/:id | Organizer | Delete or cancel event |
| POST | /api/registrations/:eventId | Public | Student registration |
| GET | /api/registrations/manage/:eventId | Organizer | Attendee list |
| POST | /api/registrations/check-in | Organizer | Single-use ticket check-in |
| GET | /api/registrations/ticket/:ticketCode | Public | Ticket summary |

Protected routes use `Authorization: Bearer <token>`.

## Important production hardening still required

- Registration uses an atomic event seat counter to prevent overselling under concurrent requests and compensates the counter if the registration insert fails. For strict crash-safe consistency, use a MongoDB transaction/replica set or add a reconciliation job for interrupted reservations.
- Self-service organizer registration is open in this starter. Before institutional deployment, replace it with admin invitation/approval or a controlled organizer provisioning process.
- Manual ticket-code check-in and browser camera-based QR scanning are available in the organizer interface. QR images are generated after registration; downloadable/email ticket delivery is not included yet. Camera scanning requires HTTPS (or localhost) and user permission.
- Configure exact production CORS origins, HTTPS, backups, monitoring, and secure secret management. Never commit real environment files.
- Ensure MongoDB indexes are built before opening registration traffic.

## Verification

- Backend unit and MongoDB-backed API integration tests: `npm test` (the CI workflow provisions MongoDB).
- Frontend production build: `npm run build`

A GitHub commit is not proof that commands have passed. Run these in a Node 20+ environment with dependencies installed; configure MongoDB to exercise database-backed API flows.

## Reference demo

The following live demo belongs to the reference project consulted during development; it is **not** a deployed instance of OERMS:

https://event-registration-smart-checkin.vercel.app/

OERMS itself is currently source-code/CI verified and still requires its own frontend and backend deployment before it has a live demo URL.

## Attribution

Reference consulted: https://github.com/Priyanka170974/Event-Registration-Smart-Checkin. Any adapted source must retain applicable notices and comply with the source repository's actual license and permissions. This project does not claim that reference material has been relicensed or that all referenced ideas/code are original.
