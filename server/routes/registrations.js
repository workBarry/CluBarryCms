const { Router } = require('express');
const auth = require('../middleware/auth');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = (db) => {
  const r = Router();
  const col = db.collection('registrations');

  r.use(auth(db));

  r.get('/', wrap(async (req, res) => {
    const { userId, eventId, sessionId } = req.query;
    let q = col;
    if (userId) q = q.where('userId', '==', userId);
    if (eventId) q = q.where('eventId', '==', eventId);
    if (sessionId) q = q.where('sessionId', '==', sessionId);
    const snap = await q.get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }));

  r.get('/:id', wrap(async (req, res) => {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, ...doc.data() });
  }));

  r.post('/', wrap(async (req, res) => {
    const data = req.body;
    data.userId = data.userId || req.uid;
    data.createdAt = new Date().toISOString();
    const ref = await col.add(data);
    res.status(201).json({ id: ref.id });
  }));

  r.put('/:id', wrap(async (req, res) => {
    await col.doc(req.params.id).set(req.body, { merge: true });
    res.json({ ok: true });
  }));

  r.delete('/:id', wrap(async (req, res) => {
    await col.doc(req.params.id).delete();
    res.json({ ok: true });
  }));

  return r;
};
