# Backend (Contact API)

Stores contact form messages in MongoDB.

## Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Install deps: `npm install`
3. Run server: `npm start`

Notes:
- `MONGO_URI` should be your Mongo host (example: `mongodb://127.0.0.1:27017`).
- Make sure MongoDB is running locally, or use your Atlas connection string.

Frontend:
- When your site is opened on `localhost` / `127.0.0.1`, the form sends to `http://<host>:5000/api/contact`.
- If you deploy the frontend to another domain, set `data-api-base="https://your-backend-domain"` on the `.contact__form` element (or update `getApiBase()` in `script.js`).

## API

- `POST /api/contact`
  - body: `{ "name": "...", "email": "...", "message": "..." }`
