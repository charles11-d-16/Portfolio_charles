import mongoose from 'mongoose';

const buildMongoUri = (mongoUri, dbName) => {
  const trimmed = String(mongoUri || '').trim();
  if (!trimmed) throw new Error('Missing MONGO_URI');

  try {
    const url = new URL(trimmed);
    const hasDbInPath = Boolean(url.pathname && url.pathname !== '/' && url.pathname !== '');
    if (hasDbInPath) return trimmed;

    const finalDbName = String(dbName || '').trim();
    if (!finalDbName) throw new Error('Missing DB_NAME');
    url.pathname = `/${finalDbName}`;
    return url.toString();
  } catch {
    const finalDbName = String(dbName || '').trim();
    if (!finalDbName) throw new Error('Missing DB_NAME');
    return trimmed.endsWith('/') ? `${trimmed}${finalDbName}` : `${trimmed}/${finalDbName}`;
  }
};

export const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI || '';
  const dbName = process.env.DB_NAME || 'portfolio';
  const uri = buildMongoUri(mongoUri, dbName);
  await mongoose.connect(uri);
};
