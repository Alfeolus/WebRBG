const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    }),
  });
}
const db = admin.firestore();

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Hanya GET' });
  try {
    const snapshot = await db.collection('orders').orderBy('timestamp', 'desc').get();
    const orders = [];
    snapshot.forEach(doc => orders.push(doc.data()));
    res.status(200).json({ status: "success", orders: orders });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};