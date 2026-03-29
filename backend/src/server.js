import { existsSync } from 'node:fs';
import dotenv from 'dotenv';

import app from './app.js';
import { connectDb } from './config/db.js';

const envPath = new URL('../.env', import.meta.url);
dotenv.config({ path: envPath });

if (!process.env.MONGO_URI) {
  const examplePath = new URL('../.env.example', import.meta.url);
  if (existsSync(examplePath)) {
    dotenv.config({ path: examplePath });
    if (process.env.MONGO_URI) {
      console.warn('Loaded MONGO_URI from .env.example. Create backend/.env for your real config.');
    }
  }
}

const port = Number(process.env.PORT || 5000);

const start = async () => {
  await connectDb();
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
};

start().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
