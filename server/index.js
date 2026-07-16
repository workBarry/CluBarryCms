require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const admin = require('firebase-admin');

const clubsRouter = require('./routes/clubs');
const eventsRouter = require('./routes/events');
const sessionsRouter = require('./routes/sessions');
const announcementsRouter = require('./routes/announcements');
const registrationsRouter = require('./routes/registrations');
const membersRouter = require('./routes/members');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');

if (!admin.apps.length) {
  let serviceAccount;
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    serviceAccount = require('../service-account.json');
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

const { Timestamp } = require('firebase-admin/firestore');
const serialize = (v) => (v instanceof Timestamp ? v.toDate().toISOString() : v);
const serializeDoc = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(serializeDoc);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v instanceof Timestamp ? v.toDate().toISOString()
           : v && typeof v === 'object' && v._seconds != null && v._nanoseconds != null ? new Timestamp(v._seconds, v._nanoseconds).toDate().toISOString()
           : v;
  }
  return out;
};
app.use((_req, res, next) => {
  const orig = res.json.bind(res);
  res.json = (data) => orig(data && typeof data === 'object' ? serializeDoc(data) : data);
  next();
});

app.use('/api/clubs', clubsRouter(db));
app.use('/api/events', eventsRouter(db));
app.use('/api/sessions', sessionsRouter(db));
app.use('/api/announcements', announcementsRouter(db));
app.use('/api/registrations', registrationsRouter(db));
app.use('/api/members', membersRouter(db));
app.use('/api/users', usersRouter(db));
app.use('/api/notifications', notificationsRouter(db));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use((err, _req, res, _next) => {
  console.error('API error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

if (require.main === module) {
  const PORT = process.env.API_PORT || 3000;
  app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));
}

module.exports = app;
