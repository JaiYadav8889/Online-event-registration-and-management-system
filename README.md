# Online Event Registration and Management System (OERMS)

A full-stack platform for managing college events, student registrations, and attendance.

## Project status

Repository documentation and initial setup are in progress. Features will be delivered in documented stages; functionality will be marked complete only after implementation and verification.

## Planned technology stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Authentication: JWT and bcrypt
- Testing: automated backend and frontend checks

## Planned capabilities

- Organizer/admin authentication and role-based access
- Event creation, editing, scheduling, capacity, and status management
- Public event discovery and student registration
- Duplicate-registration and capacity validation
- Unique registration tickets with QR codes
- QR-based and manual attendance check-in
- Organizer dashboard, participant management, and registration statistics

## Development principles

- Validate inputs on both client and server.
- Enforce authorization on protected API routes.
- Keep secrets in environment variables; never commit real credentials.
- Test critical registration and check-in flows, including duplicate and concurrent requests.
- Document setup, environment variables, API routes, and known limitations.

## Local development

Setup instructions will be added with the application scaffold and environment templates.

## Attribution and reuse

This project uses the Event Registration & Smart Check-in Platform repository as a reference: https://github.com/Priyanka170974/Event-Registration-Smart-Checkin. Any adapted material will retain applicable attribution and license notices. No license is inferred from the reference README; reuse must comply with the source repository's actual permissions and applicable terms.
