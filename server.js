// File: server.js
// Versi ini diubah kembali ke Sistem Manual "Kode Unik"
// SEMUA KODE DOKU / PAYMENT GATEWAY DIHAPUS

const express = require('express');
const mysql = require('mysql2/promise'); 
const crypto = require('crypto'); 
require('dotenv').config(); 

const app = express();
const PORT = 3000;

// --- KONEKSI DATABASE (MySQL / XAMPP) ---
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- Middleware ---
app.use(express.json());
app.use(express.static('public'));

// ------------------------------------
// --- API ENDPOINTS ---
// ------------------------------------

// 1. API untuk mengambil semua produk
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. API untuk membuat pesanan BARU (Logika Kode Unik)
app.post('/api/create-order', async (req, res) => {
    
    const { items, customer_name, customer_phone, customer_class } = req.body;
    const connection = await pool.getConnection(); 
    
    try {
        await connection.beginTransaction(); 

        // --- 1. Validasi Harga & Hitung Total ASLI ---
        let totalAmountAsli = 0;
        const orderItemsData = [];

        for (const item of items) {
            const [productRows] = await connection.query('SELECT price FROM products WHERE id = ?', [item.id]);
            if (productRows.length === 0) {
                throw new Error(`Produk ID ${item.id} tidak ditemukan`);
            }
            const price = productRows[0].price;
            totalAmountAsli += price * item.quantity;
            
            orderItemsData.push({
                product_id: item.id,
                quantity: item.quantity,
                price_at_purchase: price
            });
        }

        // --- 2. Simpan Pesanan Awal ke Database (Status PENDING) ---
        // Kita masukkan totalAmountAsli dulu
        const [orderRes] = await connection.query(
            'INSERT INTO orders (total_amount, status, customer_name, customer_phone, customer_class) VALUES (?, ?, ?, ?, ?)',
            [totalAmountAsli, 'PENDING', customer_name, customer_phone, customer_class]
        );
        
        const newOrderId = orderRes.insertId; 

        // --- 3. Hitung Kode Unik & Total Final ---
        // Kita gunakan ID order sebagai basis kode unik (1-99)
        // (ID 1 -> 2), (ID 98 -> 99), (ID 99 -> 1), (ID 100 -> 2), dst.
        const kode_unik = (newOrderId % 99) + 1;
        const totalFinal = totalAmountAsli + kode_unik;

        // --- 4. Update Pesanan dengan Total Final ---
        await connection.query(
            'UPDATE orders SET total_amount = ? WHERE id = ?',
            [totalFinal, newOrderId]
        );

        // 5. Masukkan barang-barang ke 'order_items'
        for (const itemData of orderItemsData) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
                [newOrderId, itemData.product_id, itemData.quantity, itemData.price_at_purchase]
            );
        }
        
        // --- 6. Selesaikan Transaksi DB & Kirim data ke Frontend ---
        await connection.commit(); 
        console.log(`Order ${newOrderId} (manual) oleh ${customer_name} dibuat. Total: ${totalFinal} (Kode Unik: ${kode_unik})`);
        
        res.status(201).json({
            message: "Order manual berhasil dibuat.",
            orderId: newOrderId,
            finalAmount: totalFinal // Kirim Total Akhir ke frontend
        });

    } catch (err) {
        await connection.rollback(); 
        console.error("Error saat membuat order manual:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release(); 
    }
});

// 3. API untuk cek status order
// (Ini tidak dipakai frontend, tapi bisa Anda pakai untuk cek manual)
app.get('/api/order-status/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT status, total_amount FROM orders WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Order tidak ditemukan' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint simulate-payment dan doku-webhook sudah dihapus.

// --- Menjalankan Server ---
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});