document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('login-overlay');
    const dashboard = document.getElementById('admin-dashboard');
    const passwordInput = document.getElementById('admin-password');
    const btnLogin = document.getElementById('btn-login');
    const errorMsg = document.getElementById('login-error');
    const btnLogout = document.getElementById('btn-logout');
    const btnRefresh = document.getElementById('btn-refresh');

    if (sessionStorage.getItem('isAdminActive') === 'true') {
        loginOverlay.style.display = 'none';
        dashboard.style.display = 'flex';
        fetchOrders();
    }

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
                // Login Berhasil
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

    async function fetchOrders() {
        try {
            const response = await fetch('/api/getorders'); 
            if (!response.ok) throw new Error("Gagal mengambil data");
            const data = await response.json();
            
            renderTable(data.orders);
            calculateStats(data.orders);
        } catch (error) {
            console.error(error);
            renderTable([]);
            calculateStats([]);
        }
    }

    function renderTable(orders) {
        const tbody = document.getElementById('orders-body');
        tbody.innerHTML = '';

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 50px;">Belum ada pesanan yang masuk.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');
            const totalRupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total);
            const waLink = `https://wa.me/62${order.wa.replace(/^0/, '')}`;

            tr.innerHTML = `
                <td><strong>${order.id}</strong></td>
                <td>${order.nama} <br><small style="color:var(--text-secondary);">${order.kelas}</small></td>
                <td><a href="${waLink}" target="_blank" style="color:var(--accent-cyan); text-decoration:none; font-weight:bold;">📱 ${order.wa}</a></td>
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

        document.querySelectorAll('.status-dropdown').forEach(select => {
            select.addEventListener('change', (e) => updateStatus(e.target.dataset.id, e.target.value));
        });
    }

    async function updateStatus(orderId, newStatus) {
        try {
            const response = await fetch('/api/updatestatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: orderId, status: newStatus })
            });
            if (response.ok) {
                fetchOrders();
            } else {
                alert('Gagal mengupdate status di server.');
            }
        } catch (error) {
            alert('Terjadi kesalahan koneksi!');
        }
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
});