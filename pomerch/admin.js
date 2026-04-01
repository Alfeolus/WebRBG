document.addEventListener('DOMContentLoaded', () => {
    // Variabel DOM
    const loginOverlay = document.getElementById('login-overlay');
    const dashboard = document.getElementById('admin-dashboard');
    const passwordInput = document.getElementById('admin-password');
    const btnLogin = document.getElementById('btn-login');
    const errorMsg = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');

    // Variabel Navigasi Antar Menu
    const navDashboard = document.getElementById('nav-dashboard');
    const navReferral = document.getElementById('nav-referral');
    const viewDashboard = document.getElementById('view-dashboard');
    const viewReferral = document.getElementById('view-referral');
    const referralGrid = document.getElementById('referral-grid');

    // Variabel Modal Rekap Item
    const btnRecap = document.getElementById('btn-recap');
    const recapOverlay = document.getElementById('recap-overlay');
    const closeRecapBtn = document.getElementById('close-recap-btn');
    const recapContent = document.getElementById('recap-content');
    
    // Variabel Penyimpan Data & Daftar Kode Referral
    let globalOrders = [];
    const REFERRAL_LIST = ["Love", "Faithfull", "Patience", "Joy", "Kindness", "Peace", "Goodness"];

    // ==========================================
    // INIT & NAVIGASI
    // ==========================================
    if (sessionStorage.getItem('isAdminActive') === 'true') {
        loginOverlay.style.display = 'none';
        dashboard.style.display = 'flex';
        fetchOrders();
    }

    navDashboard.addEventListener('click', () => {
        navDashboard.classList.add('active');
        navReferral.classList.remove('active');
        viewDashboard.style.display = 'block';
        viewReferral.style.display = 'none';
    });

    navReferral.addEventListener('click', () => {
        navReferral.classList.add('active');
        navDashboard.classList.remove('active');
        viewDashboard.style.display = 'none';
        viewReferral.style.display = 'block';
        renderReferralRecap(); // Tampilkan data saat menu diklik
    });

    // ==========================================
    // SISTEM LOGIN & FETCH
    // ==========================================
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
        window.location.reload(); // Reload bersih
    });

    btnRefresh.addEventListener('click', fetchOrders);

    async function fetchOrders() {
        try {
            const response = await fetch('/api/getorders'); 
            if (!response.ok) throw new Error("Gagal mengambil data");
            const data = await response.json();
            
            globalOrders = data.orders || []; 

            renderTable(globalOrders);
            calculateStats(globalOrders);
            
            // Jika admin sedang buka tab referral, langsung update datanya juga
            if(viewReferral.style.display === 'block') {
                renderReferralRecap();
            }

        } catch (error) {
            console.error(error);
            renderTable([]);
            calculateStats([]);
            globalOrders = [];
        }
    }

    // ==========================================
    // FITUR BARU: REKAP REFERRAL
    // ==========================================
    function renderReferralRecap() {
        referralGrid.innerHTML = ''; // Kosongkan dulu
        
        REFERRAL_LIST.forEach(code => {
            // Hitung berapa kali kode ini dipakai di database pesanan
            const count = globalOrders.filter(order => {
                // Pastikan order punya referralCode dan cocok (tidak peduli huruf besar/kecil)
                return order.referralCode && order.referralCode.toLowerCase() === code.toLowerCase();
            }).length;

            const countPaid = globalOrders.filter(order => {
                return order.referralCode && order.referralCode.toLowerCase() === code.toLowerCase() && order.status === 'paid';
            }).length;

            // Buat elemen Card
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.style.borderColor = 'var(--accent-cyan)'; // Warna list biru neon
            
            card.innerHTML = `
                <h3>Kode: ${code}</h3>
                <p>${count} <span style="font-size: 0.4em; color: var(--text-secondary); font-weight: 700;">Pesanan</span></p>
                <small style="color: var(--success); font-weight: 800; display: block; margin-top: 5px;">✅ ${countPaid} Sudah Bayar</small>
            `;
            
            referralGrid.appendChild(card);
        });
    }

    // ==========================================
    // RENDER TABEL & HITUNG STATS UTAMA
    // ==========================================
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

    // ==========================================
    // ACTION: UPDATE & DELETE
    // ==========================================
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

    // ==========================================
    // MODAL: REKAP PER ITEM BARANG
    // ==========================================
    btnRecap.addEventListener('click', () => {
        generateRecap(globalOrders);
        recapOverlay.style.display = 'flex';
    });

    closeRecapBtn.addEventListener('click', () => {
        recapOverlay.style.display = 'none';
    });

    function generateRecap(orders) {
        const recapMap = {};
        const validOrders = orders.filter(o => o.status === 'paid');

        validOrders.forEach(order => {
            if (!order.items) return;
            const itemsList = order.items.split('\n'); 
            
            itemsList.forEach(itemLine => {
                const regex = /^(.*?)\s+\(x(\d+)\)(?:\s+-\s+@[^\[]+)?(?:\[Opsi:\s+(.*?)\])?$/;
                const match = itemLine.match(regex);
                
                if (match) {
                    const itemName = match[1].trim();
                    const itemQty = parseInt(match[2]);
                    const itemOptions = match[3] ? match[3].trim() : '';
                    
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

        recapContent.innerHTML = '';
        
        if (Object.keys(recapMap).length === 0) {
            recapContent.innerHTML = '<p style="text-align:center; padding: 30px; font-weight: bold; color: var(--danger);">Belum ada pesanan dengan status PAID yang bisa direkap.</p>';
            return;
        }

        const sortedKeys = Object.keys(recapMap).sort();

        sortedKeys.forEach(key => {
            const group = recapMap[key];
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
});