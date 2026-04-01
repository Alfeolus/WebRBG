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
  if (req.method !== 'POST') return res.status(405).json({ message: 'Hanya POST' });
  try {
    const { orderId } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!orderId) throw new Error("Data tidak lengkap");
    
    // Perintah untuk menghapus dokumen dari database Firebase
    await db.collection('orders').doc(orderId).delete();
    
    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
};