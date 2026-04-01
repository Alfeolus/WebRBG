document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('login-overlay');
    const dashboard = document.getElementById('admin-dashboard');
    const passwordInput = document.getElementById('admin-password');
    const btnLogin = document.getElementById('btn-login');
    const errorMsg = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');

    // Variabel Modal Rekap
    const btnRecap = document.getElementById('btn-recap');
    const recapOverlay = document.getElementById('recap-overlay');
    const closeRecapBtn = document.getElementById('close-recap-btn');
    const recapContent = document.getElementById('recap-content');
    
    // Variabel Penyimpan Data Sementara
    let globalOrders = [];

    // Cek status login saat halaman pertama kali dibuka
    if (sessionStorage.getItem('isAdminActive') === 'true') {
        loginOverlay.style.display = 'none';
        dashboard.style.display = 'flex';
        fetchOrders();
    }

    // 1. Sistem Login
    btnLogin.addEventListener('click', async () => {
        const enteredPassword = passwordInput.value;
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: enteredPassword })
            });
            const result = await response.json();
            if (result.success) {
                loginOverlay.style.display = 'none';
                dashboard.style.display = 'flex';
                sessionStorage.setItem('isAdminActive', 'true');
                fetchOrders();
                errorMsg.style.display = 'none';
            } else {
                errorMsg.style.display = 'block';
                errorMsg.innerText = "❌ Password Salah!";
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Gagal terhubung ke server login.");
        }
    });

    btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('isAdminActive');
        dashboard.style.display = 'none';
        loginOverlay.style.display = 'flex';
        passwordInput.value = '';
    });

    btnRefresh.addEventListener('click', fetchOrders);

    // 2. Fetch Data & Eksekusi Render
    async function fetchOrders() {
        try {
            const response = await fetch('/api/getorders'); 
            if (!response.ok) throw new Error("Gagal mengambil data");
            const data = await response.json();
            
            globalOrders = data.orders; // Simpan data ke variabel global

            renderTable(globalOrders);
            calculateStats(globalOrders);
        } catch (error) {
            console.error(error);
            renderTable([]);
            calculateStats([]);
            globalOrders = [];
        }
    }

    // 3. Render Tabel Utama
    function renderTable(orders) {
        const tbody = document.getElementById('orders-body');
        tbody.innerHTML = '';

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 50px;">Belum ada pesanan yang masuk.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');
            const totalRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total);
            const waLink = `https://wa.me/62${order.wa.replace(/^0/, '')}`;
            const detailPesanan = order.items ? order.items.replace(/\n/g, '<br>') : '-';

            tr.innerHTML = `
                <td data-label="Order ID"><strong>${order.id}</strong></td>
                <td data-label="Pemesan">${order.nama} <br><small style="color:var(--text-secondary);">${order.kelas}</small></td>
                <td data-label="WhatsApp"><a href="${waLink}" target="_blank" style="color:var(--accent-cyan); text-decoration:none; font-weight:bold;">📱 ${order.wa}</a></td>
                <td data-label="Detail Pesanan" style="font-size: 0.85em; line-height: 1.5; white-space: pre-wrap;">${detailPesanan}</td>
                <td data-label="Total Bayar">${totalRupiah}</td>
                <td data-label="Status">
                    <span class="badge ${order.status}">${order.status.toUpperCase()}</span>
                </td>
                <td data-label="Aksi">
                    <select class="status-dropdown" data-id="${order.id}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${order.status === 'paid' ? 'selected' : ''}>Paid</option>
                    </select>
                    <button class="btn-delete" data-id="${order.id}">🗑️ Hapus</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.status-dropdown').forEach(select => {
            select.addEventListener('change', (e) => updateStatus(e.target.dataset.id, e.target.value));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteOrder(e.target.dataset.id));
        });
    }

    // 4. Sistem Logika Fitur "Rekap Item" (Paling Canggih)
    btnRecap.addEventListener('click', () => {
        generateRecap(globalOrders);
        recapOverlay.style.display = 'flex';
    });

    closeRecapBtn.addEventListener('click', () => {
        recapOverlay.style.display = 'none';
    });

    function generateRecap(orders) {
        const recapMap = {};

        // Hanya hitung pesanan yang SUDAH DIBAYAR (Paid)
        const validOrders = orders.filter(o => o.status === 'paid');

        validOrders.forEach(order => {
            if (!order.items) return;
            const itemsList = order.items.split('\n'); // Pisahkan tiap barang di keranjang
            
            itemsList.forEach(itemLine => {
                // Mesin pencari otomatis format: "Nama Barang (xQty) - @Harga [Opsi]"
                const regex = /^(.*?)\s+\(x(\d+)\)(?:\s+-\s+@[^\[]+)?(?:\[Opsi:\s+(.*?)\])?$/;
                const match = itemLine.match(regex);
                
                if (match) {
                    const itemName = match[1].trim();
                    const itemQty = parseInt(match[2]);
                    const itemOptions = match[3] ? match[3].trim() : '';
                    
                    // Kunci Pengelompokan (Gabungan Nama + Varian)
                    const key = itemOptions ? `${itemName} - ${itemOptions}` : itemName;

                    if (!recapMap[key]) {
                        recapMap[key] = { totalQty: 0, buyers: [] };
                    }

                    recapMap[key].totalQty += itemQty;
                    recapMap[key].buyers.push({
                        nama: order.nama,
                        kelas: order.kelas,
                        wa: order.wa,
                        qty: itemQty
                    });
                }
            });
        });

        // Tampilkan ke HTML Modal
        recapContent.innerHTML = '';
        
        if (Object.keys(recapMap).length === 0) {
            recapContent.innerHTML = '<p style="text-align:center; padding: 30px; font-weight: bold; color: var(--danger);">Belum ada pesanan dengan status PAID yang bisa direkap.</p>';
            return;
        }

        // Urutkan sesuai abjad biar rapi
        const sortedKeys = Object.keys(recapMap).sort();

        sortedKeys.forEach(key => {
            const group = recapMap[key];
            
            // Susun list pembeli
            let buyersHtml = group.buyers.map(b => 
                `<li><strong>${b.nama}</strong> <span style="color:var(--text-secondary);">(${b.kelas})</span> 
                 <a href="https://wa.me/62${b.wa.replace(/^0/,'')}" target="_blank" style="color:var(--accent-cyan); text-decoration:none; margin-left:10px;">📱 ${b.wa}</a> 
                 <span style="float:right; color:var(--danger); font-weight:900;">[${b.qty} pcs]</span></li>`
            ).join('');

            const section = document.createElement('div');
            section.className = 'recap-item-group';
            section.innerHTML = `
                <h3>
                    ${key} 
                    <span class="badge-qty">Total: ${group.totalQty}</span>
                </h3>
                <ul>${buyersHtml}</ul>
            `;
            recapContent.appendChild(section);
        });
    }

    // 5. Update Status & Delete Order
    async function updateStatus(orderId, newStatus) {
        try {
            const response = await fetch('/api/updatestatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId, status: newStatus })
            });
            if (response.ok) fetchOrders();
            else alert('Gagal mengupdate status di server.');
        } catch (error) { alert('Terjadi kesalahan koneksi!'); }
    }

    async function deleteOrder(orderId) {
        const confirmDelete = confirm(`⚠️ Peringatan!\nYakin ingin menghapus pesanan ${orderId}? Data yang dihapus tidak bisa dikembalikan.`);
        if (!confirmDelete) return;

        try {
            const response = await fetch('/api/deleteorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId })
            });
            if (response.ok) fetchOrders(); 
            else alert('Gagal menghapus data di server.');
        } catch (error) { alert('Terjadi kesalahan koneksi!'); }
    }

    // 6. Stats
    function calculateStats(orders) {
        const totalOrders = orders.length;
        const totalPending = orders.filter(o => o.status === 'pending').length;
        const totalRevenue = orders
            .filter(o => o.status === 'paid')
            .reduce((sum, order) => sum + order.total, 0);

        document.getElementById('stat-total-orders').textContent = totalOrders;
        document.getElementById('stat-pending').textContent = totalPending;
        document.getElementById('stat-revenue').textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalRevenue);
    }
});