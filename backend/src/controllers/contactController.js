import ContactMessage from '../models/ContactMessage.js';

const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');

export const createContactMessage = async (req, res, next) => {
  try {
    const name = sanitize(req.body?.name);
    const email = sanitize(req.body?.email);
    const message = sanitize(req.body?.message);

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    if (name.length > 120 || email.length > 254 || message.length > 4000) {
      return res.status(400).json({ error: 'Input too long.' });
    }

    const doc = await ContactMessage.create({ name, email, message });
    return res.status(201).json({ ok: true, id: doc._id });
  } catch (err) {
    return next(err);
  }
};

