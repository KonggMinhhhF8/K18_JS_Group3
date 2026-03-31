
const API_BASE = 'https://k305jhbh09.execute-api.ap-southeast-1.amazonaws.com';

// Biến toàn cục để quản lý instance biểu đồ (tránh lỗi ghi đè)
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

// 3. Hàm Fetch có xác thực và tự động sửa lỗi Token
async function authorizedFetch(url, options = {}) {
    let token = localStorage.getItem('access_token');

    // Xử lý trường hợp token bị lưu dưới dạng chuỗi '"abc"' (thừa dấu ngoặc kép)
    if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        let response = await fetch(url, { ...options, headers });

        // Nếu gặp lỗi 400 (Bad Request) hoặc 401 (Unauthorized)
        if (response.status === 401 || response.status === 400) {
            console.warn(`Lỗi ${response.status}, đang thử cấp lại token...`);
            const isRefreshed = await handleRefreshToken();
            if (isRefreshed) {
                const newToken = localStorage.getItem('access_token');
                headers['Authorization'] = `Bearer ${newToken}`;
                return await fetch(url, { ...options, headers });
            } else {
                // Nếu refresh thất bại, đá về trang login
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

// 4. Hàm lấy dữ liệu chính
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
    // Tính toán số liệu
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

    // Cập nhật các thẻ thống kê (Stat Cards)
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

    // Gom dữ liệu doanh thu theo ngày (Ví dụ 7 ngày gần nhất)
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const data = [12, 19, 15, 25, 22, 30, 28].map(v => v * 1000000); // Demo dữ liệu biến động

    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// 7. Vẽ biểu đồ Cơ cấu Sản phẩm
function drawCategoryChart(products) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    const catData = {};
    products.forEach(p => {
        const catName = p.category?.name || "Khác";
        catData[catName] = (catData[catName] || 0) + 1;
    });

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(catData),
            datasets: [{
                data: Object.values(catData),
                backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

window.onload = fetchDataAndRender;