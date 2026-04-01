const admin = require('firebase-admin');

// Inisialisasi Firebase Admin
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

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function generateFinalQrisString(nominal) {
  const qrisBaseLama = process.env.QRIS_BASE_STRING_MERCH; 
  if (!qrisBaseLama) throw new Error("Kunci QRIS belum dipasang di Vercel.");
  const nominalStr = String(Math.round(nominal));
  const amountTag = "54" + String(nominalStr.length).padStart(2, "0") + nominalStr;
  const qrisBaseTanpaCRC = qrisBaseLama.substring(0, qrisBaseLama.length - 8);
  const titikSisip = "5802ID";
  const indexSisip = qrisBaseTanpaCRC.indexOf(titikSisip);
  const part1 = qrisBaseTanpaCRC.substring(0, indexSisip);
  const part2 = qrisBaseTanpaCRC.substring(indexSisip);
  let qrisNoCRC = part1 + amountTag + part2 + "6304";
  return qrisNoCRC + crc16(qrisNoCRC);
}

module.exports = async function handler(req, res) {
  // CORS Bypass
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Hanya metode POST yang diizinkan' });

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    const kodeUnik = Math.floor(Math.random() * 99) + 1;
    const totalFinal = (data.totalAsli || 0) + kodeUnik;
    const orderId = "AOG-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const finalQrisString = generateFinalQrisString(totalFinal);

    const orderData = {
      id: orderId,
      nama: data.nama || "Tanpa Nama",
      wa: data.telepon || "",
      kelas: data.kelas || "",
      items: data.itemsString || "",
      total: totalFinal,
      referral: data.referralCode || "TIDAK ADA",
      status: "pending",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('orders').doc(orderId).set(orderData);
    res.status(200).json({ status: "success", orderId: orderId, finalAmount: totalFinal, qrisString: finalQrisString });
  } catch (error) {
    console.error("ERROR FIREBASE:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};