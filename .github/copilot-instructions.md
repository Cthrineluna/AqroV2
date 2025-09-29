# Copilot Instructions for aQRo

## Project Architecture
- **Frontend**: React Native (Expo), Redux, React Navigation. Located in `frontend/`. Key entry: `frontend/App.js`.
- **Backend**: Node.js, Express.js, Passport.js, Socket.io. Located in `backend/`. Main entry: `backend/src/app.js`.
- **Database**: MongoDB via Mongoose ODM. Models in `backend/src/models/`.
- **Containerization**: Docker and Docker Compose. See `docker-compose.yml` and `docker/`.

## Developer Workflows
- **Start All Services (Recommended)**: `docker-compose up` from project root.
- **Manual Start**:
  - Backend: `cd backend && npm run dev`
  - Frontend: `cd frontend && npx expo start --web` (for web preview)
- **Environment Variables**: Backend requires `.env` (see README for template).
- **Frontend Config**: Edit `frontend/app.json` for Expo settings.

## Key Patterns & Conventions
- **Backend Routing**: All API routes in `backend/src/routes/`. Controllers in `backend/src/controllers/`.
- **Auth**: JWT-based, with Passport.js. Middleware in `backend/src/middleware/authMiddleware.js`.
- **Models**: Mongoose schemas in `backend/src/models/`.
- **Frontend State**: Redux for global state. Components in `frontend/src/components/`.
- **QR Scanning**: Uses React Native Camera in frontend.
- **Uploads**: File uploads stored in `backend/uploads/`.
- **Seeding**: Data seed scripts in `backend/src/seeds/`.

## Integration Points
- **Email**: Configured via environment variables, uses Gmail SMTP in backend (`backend/src/services/emailService.js`).
- **Socket.io**: Real-time features (see backend setup).
- **API Communication**: Frontend communicates with backend via REST endpoints defined in backend routes.

## Examples
- To add a new API route: create a route file in `backend/src/routes/`, controller in `backend/src/controllers/`, and update `backend/src/app.js`.
- To add a new frontend screen: create a component in `frontend/src/screens/`, add to navigation in `frontend/src/navigation/`.

## References
- See `README.md` for setup and workflow details.
- See `docker-compose.yml` for service orchestration.
- See `backend/src/models/` for data structure.

---
_If any section is unclear or missing, please provide feedback for improvement._
