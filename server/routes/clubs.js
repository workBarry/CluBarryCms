const { Router } = require('express');
const auth = require('../middleware/auth');

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = (db) => {
  const r = Router();
  const col = db.collection('clubs');
  const membersCol = db.collection('clubMembers');

  r.use(auth(db));

  r.get('/', wrap(async (req, res) => {
    const [activeSnap, pendingSnap] = await Promise.all([
      col.where('status', '==', 'active').get(),
      col.where('status', '==', 'pending').where('createdBy', '==', req.uid).get(),
    ]);
    const map = new Map();
    activeSnap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
    pendingSnap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
    res.json([...map.values()]);
  }));

  r.get('/:id', wrap(async (req, res) => {
    const doc = await col.doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.json({ id: doc.id, ...doc.data() });
  }));

  r.post('/', wrap(async (req, res) => {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const existing = await col.where('name', '==', name).limit(1).get();
    if (!existing.empty) return res.status(409).json({ error: '社團名稱已存在' });
    const data = req.body;
    data.createdBy = req.uid;
    data.status = data.status || 'pending';
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

  r.get('/:clubId/members', wrap(async (req, res) => {
    const snap = await membersCol.where('clubId', '==', req.params.clubId).get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }));

  return r;
};
