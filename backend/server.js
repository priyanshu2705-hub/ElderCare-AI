const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
if (env.nodeEnv === 'production') app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.frontendUrls }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/grocery', require('./routes/grocery'));
app.use('/api/trusted-contacts', require('./routes/trustedContacts'));
app.use('/api/privacy', require('./routes/privacy'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/caregiver', require('./routes/caregiver'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/documents', require('./routes/documents'));

app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => app.listen(env.port, () => console.log(`Backend running on http://localhost:${env.port}`)))
  .catch((e) => {
    console.error('Could not connect to MongoDB. Is it running? (docker compose up -d mongo)\n', e.message);
    process.exit(1);
  });
