module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Hanya POST' });

  const { password } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  
  // Password disimpan aman di server (Environment Variable Vercel)
  const CORRECT_PASSWORD = process.env.ADMIN_PASSWORD || "jojo123@";

  if (password === CORRECT_PASSWORD) {
    // Kirim respon sukses tanpa membocorkan password asli
    return res.status(200).json({ success: true, token: "SESI_ADMIN_AKTIF" });
  } else {
    return res.status(401).json({ success: false, message: "Password Salah!" });
  }
};