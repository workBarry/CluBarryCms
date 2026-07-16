const { Router } = require('express');
const auth = require('../middleware/auth');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = (db) => {
  const r = Router();
  const col = db.collection('users');

  r.use(auth(db));

  r.get('/:id', wrap(async (req, res) => {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, ...doc.data() });
  }));

  r.put('/:id', wrap(async (req, res) => {
    const { role, permissionsOverride, ...safe } = req.body;
    await col.doc(req.params.id).set(safe, { merge: true });
    res.json({ ok: true });
  }));

  return r;
};
