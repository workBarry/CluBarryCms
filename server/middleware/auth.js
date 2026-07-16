const admin = require('firebase-admin');

function authMiddleware(db) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    try {
      const decoded = await admin.auth().verifyIdToken(header.slice(7));
      req.uid = decoded.uid;
      const snap = await db.collection('users').doc(decoded.uid).get();
      req.user = snap.exists ? { id: snap.id, ...snap.data() } : null;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

module.exports = authMiddleware;
