import mongoose from 'mongoose';

export const connectDb = async () => {
  const mongoUri = process.env.MONGO_URI || '';
  const dbName = process.env.DB_NAME || 'portfolio';
  if (!mongoUri) throw new Error('Missing MONGO_URI');

  const uri = mongoUri.endsWith('/') ? `${mongoUri}${dbName}` : `${mongoUri}/${dbName}`;
  await mongoose.connect(uri);
};

