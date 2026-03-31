document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('login-overlay');
    const dashboard = document.getElementById('admin-dashboard');
    const passwordInput = document.getElementById('admin-password');
    const btnLogin = document.getElementById('btn-login');
    const errorMsg = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');

    // 1. Sistem Login Sederhana (Hanya proteksi dasar di sisi klien)
    // Ganti 'adminaog2025' dengan password rahasia kamu
    const ADMIN_PASSWORD = "jojo123"; 

    btnLogin.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASSWORD) {
            loginOverlay.style.display = 'none';
            dashboard.style.display = 'flex';
            fetchOrders(); // Ambil data saat berhasil masuk
        } else {
            errorMsg.style.display = 'block';
        }
    });

    btnLogout.addEventListener('click', () => {
        dashboard.style.display = 'none';
        loginOverlay.style.display = 'flex';
        passwordInput.value = '';
    });

    btnRefresh.addEventListener('click', fetchOrders);

    // 2. Mengambil Data dari Backend
    async function fetchOrders() {
        try {
            // CATATAN: Pastikan backend kamu memiliki endpoint GET '/api/getorders'
            const response = await fetch('/api/getorders'); 
            
            if (!response.ok) throw new Error("Gagal mengambil data");
            const data = await response.json();
            
            // Asumsi format respon dari backend: { status: "success", orders: [...] }
            renderTable(data.orders);
            calculateStats(data.orders);

        } catch (error) {
            console.error(error);
            // Contoh data statis jika server belum siap (hanya untuk testing tampilan):
            const mockData = [
                { id: "AOG-12345", nama: "Budi Santoso", kelas: "PPTI 20", wa: "08123456789", total: 195000, status: "paid" },
                { id: "AOG-12346", nama: "Siti Aminah", kelas: "PPBP 7", wa: "08987654321", total: 95000, status: "pending" }
            ];
            renderTable(mockData);
            calculateStats(mockData);
        }
    }

    // 3. Menampilkan Data ke Tabel
    function renderTable(orders) {
        const tbody = document.getElementById('orders-body');
        tbody.innerHTML = '';

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Belum ada pesanan</td></tr>';
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');
            
            // Format Rupiah
            const totalRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total);
            
            // Link WhatsApp (Format wa.me)
            const waLink = `https://wa.me/62${order.wa.replace(/^0/, '')}`;

            tr.innerHTML = `
                <td><strong>${order.id}</strong></td>
                <td>${order.nama} <br><small style="color:#aaa;">${order.kelas}</small></td>
                <td><a href="${waLink}" target="_blank" style="color:#00e5ff; text-decoration:none;">📱 ${order.wa}</a></td>
                <td>${totalRupiah}</td>
                <td>
                    <span class="badge ${order.status}">${order.status.toUpperCase()}</span>
                </td>
                <td>
                    <select class="status-dropdown" data-id="${order.id}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Tambahkan event listener untuk ganti status
        document.querySelectorAll('.status-dropdown').forEach(select => {
            select.addEventListener('change', (e) => updateStatus(e.target.dataset.id, e.target.value));
        });
    }

    // 4. Update Status ke Backend
    async function updateStatus(orderId, newStatus) {
        try {
            // CATATAN: Pastikan backend kamu memiliki endpoint POST '/api/updatestatus'
            await fetch('/api/updatestatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId, status: newStatus })
            });
            fetchOrders(); // Refresh data setelah update
        } catch (error) {
            alert('Gagal mengupdate status!');
        }
    }

    // 5. Hitung Statistik Otomatis
    function calculateStats(orders) {
        const totalOrders = orders.length;
        const totalPending = orders.filter(o => o.status === 'pending').length;
        
        // Hanya hitung revenue dari pesanan yang sudah dibayar (paid)
        const totalRevenue = orders
            .filter(o => o.status === 'paid')
            .reduce((sum, order) => sum + order.total, 0);

        document.getElementById('stat-total-orders').textContent = totalOrders;
        document.getElementById('stat-pending').textContent = totalPending;
        document.getElementById('stat-revenue').textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalRevenue);
    }
});