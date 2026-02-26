# Fitway Hub Backend API

This is the backend API for the Fitway Hub application, built with Node.js, Express, and SQLite.

## Features

- **Authentication**: JWT-based auth (Register/Login)
-- **Health Connect Integration**: Sync daily steps (simulated via API)
- **AI Analysis**: Analyze daily activity using Google Gemini AI
- **Database**: SQLite for user and activity storage

## API Endpoints

### Authentication

- `POST /api/auth/register`
  - Body: `{ "email": "user@example.com", "password": "password123" }`
- `POST /api/auth/login`
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ "token": "jwt_token", "user": { ... } }`

### Health Data

- `GET /api/health/steps/today`
- `- Headers: `Authorization: Bearer <token>`
- `POST /api/health/steps/sync`
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "steps": 5000, "date": "2023-10-27" }`

### AI Analysis

- `POST /api/ai/analyze-steps`
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ "steps": 8500 }`
  - Returns: JSON with performance rating, advice, motivation, and goals.

## Deployment Instructions

1.  **Build the Frontend**:
    ```bash
    npm run build
    ```
    This creates the `dist/` directory with the React app.

2.  **Environment Variables**:
    Ensure `.env` is configured with:
    ```
    NODE_ENV=production
    JWT_SECRET=your_secure_secret
    GEMINI_API_KEY=your_gemini_key
    ```

3.  **Start the Server**:
    ```bash
    npm start
    ```
    (Ensure `npm start` runs `node dist/server.js` or `tsx server.ts` depending on your build process. For this setup, `tsx server.ts` works if dependencies are installed).

## Postman Testing

1.  **Register**: Send POST to `/api/auth/register`. Copy the `token`.
2.  **Analyze**: Send POST to `/api/ai/analyze-steps` with Header `Authorization: Bearer <token>` and Body `{ "steps": 10000 }`.

## Folder Structure

- `server/config`: Database setup
- `server/controllers`: Request logic
- `server/middleware`: Auth and error handling
- `server/models`: Database models (User, DailySummary)
- `server/routes`: API route definitions
- `server.ts`: Entry point
