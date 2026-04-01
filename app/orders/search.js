// 1. Biến toàn cục lưu trữ dữ liệu
let orderList = [];

window.onload = function() {
    // 2. Kiểm tra đăng nhập
    const accessToken = localStorage.getItem('access_token');
    const loggedIn = localStorage.getItem('loggedIn');

    if (!accessToken || loggedIn !== 'true') {
        window.location.href = '../Login/index.html';
        return;
    }

    // 3. Lấy dữ liệu ban đầu
    fetchOrders();

    // 4. Lắng nghe sự kiện tìm kiếm
    const searchInput = document.getElementById('search-bar');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchOrders(e.target.value);
        });
    }
};

// --- HÀM XỬ LÝ API ---

async function fetchOrders() {
    const token = localStorage.getItem('access_token');
    const tableBody = document.getElementById('orderTableBody');

    try {
        const response = await fetch('https://k305jhbh09.execute-api.ap-southeast-1.amazonaws.com/orders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 400 || response.status === 401) {
                await refreshToken();
                return; // Ngắt hàm để đợi token mới
            }
            throw new Error("Lỗi tải dữ liệu");
        }

        orderList = await response.json();
        displayOrders(orderList);

    } catch (error) {
        console.error('Fetch error:', error);
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:red;">Không thể kết nối dữ liệu.</td></tr>`;
        }
    }
}

// --- HÀM TÌM KIẾM ---

function searchOrders(searchQuery) {
    // 1. Chuẩn hóa từ khóa tìm kiếm
    const query = removeVietnameseTones(searchQuery.toLowerCase().trim());

    // 2. Lọc danh sách đơn hàng từ orderList
    const filtered = orderList.filter(order => {
        // Lấy Mã đơn (id của order)
        const orderId = order.id ? String(order.id).toLowerCase() : "";

        // Lấy Tên khách hàng (Truy cập vào order.customer.name)
        const customerName = (order.customer && order.customer.name)
            ? String(order.customer.name).toLowerCase()
            : "";

        // Chuẩn hóa dữ liệu trong danh sách sang không dấu
        const orderIdNoTone = removeVietnameseTones(orderId);
        const customerNoTone = removeVietnameseTones(customerName);

        // Khớp nếu từ khóa nằm trong Mã đơn HOẶC Tên khách hàng
        return orderIdNoTone.includes(query) || customerNoTone.includes(query);
    });

    // 3. Hiển thị lại bảng
    displayOrders(filtered);
}

function displayOrders(orders) {
    const tableBody = document.getElementById('orderTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!orders || orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Không tìm thấy đơn hàng nào</td></tr>';
        return;
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        const statusClass = getStatusBadgeClass(order.status);

        const customerName = order.customer ? order.customer.name : 'Khách lẻ';
        const customerPhone = order.customer ? order.customer.phone : '';
        const productName = order.product ? order.product.name : 'N/A';

        // TÍNH TỔNG TIỀN
        const unitPrice = order.product ? order.product.price : 0;
        const totalAmount = (order.amount || 0) * unitPrice;

        row.innerHTML = `
            <td><strong>#${order.id}</strong></td>
            <td>
                <strong>${customerName}</strong><br>
                <small>${customerPhone}</small>
            </td>
            <td>${productName} (x${order.amount})</td>
            <td><strong>${formatCurrency(totalAmount)}</strong></td>
            <td><span class="badge ${statusClass}">${order.status || 'PENDING'}</span></td>
            <td>
                <button class="btn-action" title="Xem"><i class="fas fa-eye"></i></button>
                <button class="btn-action" title="In"><i class="fas fa-print"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- HELPERS ---

function removeVietnameseTones(str) {
    if (!str) return "";
    return str.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D");
}

function formatCurrency(value) {
    if(!value || isNaN(value)) return "0đ";
    return Number(value).toLocaleString('vi-VN') + "đ";
}

function getStatusBadgeClass(status) {
    const s = String(status || "").toLowerCase();
    if (s.includes('giao') || s.includes('shipping')) return 'shipping';
    if (s.includes('thành') || s.includes('completed')) return 'completed';
    if (s.includes('hủy') || s.includes('cancelled')) return 'cancelled';
    return 'pending';
}

async function refreshToken() {
    const rToken = localStorage.getItem('refresh_token');
    if (!rToken) {
        window.location.href = '../Login/index.html';
        return;
    }
    try {
        const response = await fetch('https://k305jhbh09.execute-api.ap-southeast-1.amazonaws.com/refresh-token', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${rToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            fetchOrders();
        } else {
            window.location.href = '../Login/index.html';
        }
    } catch (e) {
        window.location.href = '../Login/index.html';
    }
}