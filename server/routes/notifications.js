const { Router } = require('express');
const auth = require('../middleware/auth');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = (db) => {
  const r = Router();
  const col = db.collection('notifications');

  r.use(auth(db));

  r.get('/', wrap(async (req, res) => {
    const { userId } = req.query;
    const uid = userId || req.uid;
    const snap = await col.where('userId', '==', uid).get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }));

  r.post('/', wrap(async (req, res) => {
    const data = req.body;
    data.createdAt = new Date().toISOString();
    const ref = await col.add(data);
    res.status(201).json({ id: ref.id });
  }));

  r.put('/:id', wrap(async (req, res) => {
    await col.doc(req.params.id).set(req.body, { merge: true });
    res.json({ ok: true });
  }));

  return r;
};
