
const API_BASE = 'https://k305jhbh09.execute-api.ap-southeast-1.amazonaws.com';

// Biến toàn cục
let revenueChartInstance = null;
let categoryChartInstance = null;

// 1. Định dạng tiền tệ VNĐ
const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + 'đ';
};

// 2. Hàm refresh token
async function handleRefreshToken() {
    const rToken = localStorage.getItem('refresh_token');
    if (!rToken) return false;
    try {
        const res = await fetch(`${API_BASE}/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rToken })
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('access_token', data.access_token);
            return true;
        }
    } catch (err) {
        console.error("Lỗi hệ thống khi Refresh Token:", err);
    }
    return false;
}

async function authorizedFetch(url, options = {}) {
    let token = localStorage.getItem('access_token');

    // Xử lý trường hợp token bị lưu dưới dạng chuỗi '"abc"'
    if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        let response = await fetch(url, { ...options, headers });

        if (response.status === 401 || response.status === 400) {
            console.warn(`Lỗi ${response.status}, đang thử cấp lại token...`);
            const isRefreshed = await handleRefreshToken();
            if (isRefreshed) {
                const newToken = localStorage.getItem('access_token');
                headers['Authorization'] = `Bearer ${newToken}`;
                return await fetch(url, { ...options, headers });
            } else {
                localStorage.clear();
                window.location.href = '../Login/index.html';
                return null;
            }
        }
        return response;
    } catch (err) {
        console.error("Lỗi kết nối API:", err);
        return null;
    }
}

// 4. Hàm lấy dữ liệu
async function fetchDataAndRender() {
    console.log("Đang tải dữ liệu từ API...");

    const [resOrders, resProducts, resCustomers] = await Promise.all([
        authorizedFetch(`${API_BASE}/orders`),
        authorizedFetch(`${API_BASE}/products`),
        authorizedFetch(`${API_BASE}/customers`)
    ]);

    if (resOrders?.ok && resProducts?.ok && resCustomers?.ok) {
        const orders = await resOrders.json();
        const products = await resProducts.json();
        const customers = await resCustomers.json();

        console.log("Dữ liệu nhận được:", { orders, products, customers });
        renderDashboard(orders, products, customers);
    } else {
        console.error("Không thể lấy dữ liệu. Kiểm tra Network tab.");
    }
}

// 5. Hàm hiển thị dữ liệu lên giao diện
function renderDashboard(orders, products, customers) {
    let totalRevenue = 0;
    let totalProfit = 0;
    let productStats = {};

    orders.forEach(order => {
        const qty = order.amount || 0;
        const price = order.product?.price || 0;
        const revenue = qty * price;

        totalRevenue += revenue;

        // Tính lợi nhuận thực tế (Giả định giá vốn = 75% giá bán)
        const costPrice = order.product?.originalPrice || (price * 0.75);
        totalProfit += (price - costPrice) * qty;

        // Thống kê sản phẩm bán chạy
        const pName = order.product?.name || "Sản phẩm ẩn";
        if (!productStats[pName]) productStats[pName] = { sold: 0, revenue: 0 };
        productStats[pName].sold += qty;
        productStats[pName].revenue += revenue;
    });

    // Cập nhật các thẻ thống kê
    const statValues = document.querySelectorAll('.stat-card .value');
    if (statValues.length >= 4) {
        statValues[0].innerText = formatCurrency(totalRevenue);
        statValues[1].innerText = orders.length;
        statValues[2].innerText = formatCurrency(totalProfit);
        statValues[3].innerText = customers.filter(c => c.rank === "BRONZE").length; // khách mới là Bronze
    }

    // Cập nhật 5 Sản phẩm bán chạy
    const sortedProducts = Object.keys(productStats)
        .map(name => ({ name, ...productStats[name] }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

    const tbody = document.querySelector('.top-products tbody');
    tbody.innerHTML = sortedProducts.map(p => `
        <tr>
            <td>${p.name}</td>
            <td>${p.sold}</td>
            <td>${formatCurrency(p.revenue)}</td>
            <td><span style="color: var(--success)">Đang bán</span></td>
        </tr>
    `).join('');

    // Vẽ biểu đồ
    drawRevenueChart(orders);
    drawCategoryChart(products);
}

// 6. Vẽ biểu đồ Doanh thu

function drawRevenueChart(orders) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (revenueChartInstance) revenueChartInstance.destroy();

    const revenueMap = {};
    const dayLabels = [];

    // Tạo mốc 7 ngày gần nhất
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        revenueMap[key] = 0;
        dayLabels.push(key);
    }

    orders.forEach(order => {
        const dateSource = order.date || order.createdAt;
        if (!dateSource) return;

        const oDate = new Date(dateSource);
        if (!isNaN(oDate)) {
            const oKey = `${oDate.getFullYear()}-${String(oDate.getMonth() + 1).padStart(2, '0')}-${String(oDate.getDate()).padStart(2, '0')}`;

            if (revenueMap.hasOwnProperty(oKey)) {
                const qty = Number(order.amount) || 0;
                const price = Number(order.product?.price) || 0;
                revenueMap[oKey] += (qty * price);
            }
        }
    });

    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dayLabels.map(k => k.split('-').reverse().slice(0, 2).join('/')),
            datasets: [{
                label: 'Doanh thu thực tế (VNĐ)',
                data: dayLabels.map(k => revenueMap[k]),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { callback: v => v.toLocaleString('vi-VN') + 'đ' } }
            }
        }
    });
}

// 7. Vẽ biểu đồ Cơ cấu Sản phẩm

function drawCategoryChart(products) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    const catStats = {};
    products.forEach(p => {
        const cat = p.category?.name || "Khác";
        catStats[cat] = (catStats[cat] || 0) + 1;
    });

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(catStats),
            datasets: [{
                data: Object.values(catStats),
                backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#e74a3b']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}


window.onload = fetchDataAndRender;