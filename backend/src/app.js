import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'node:url';

import contactRoutes from './routes/contactRoutes.js';

const app = express();

app.use(express.json({ limit: '32kb' }));

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, and file:// (origin may be undefined/null).
    if (!origin || origin === 'null') return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS blocked'), false);
  },
}));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/contact', contactRoutes);

if (String(process.env.SERVE_FRONTEND || '').toLowerCase() === 'true') {
  // Serve the static portfolio from the repo root while preventing exposure of backend source.
  app.use('/backend', (req, res) => res.status(404).json({ error: 'Not Found' }));

  const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
  app.use(express.static(repoRoot));
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Server Error' });
});

export default app;
