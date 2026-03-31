// Biến toàn cục lưu danh sách khách hàng
let customerList = [];

window.onload = function() {
    const accessToken = localStorage.getItem('access_token');
    const loggedIn = localStorage.getItem('loggedIn');

    if (!accessToken || loggedIn !== 'true') {
        window.location.href = '../Login/index.html';
    } else {
        fetchCustomers();
    }
    const searchInput = document.getElementById('inputSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            console.log("Đang gõ:", e.target.value); // Log này để bạn kiểm tra trong F12
            searchCustomers(e.target.value);
        });
    } else {
        console.error("Không tìm thấy thẻ input có id là 'inputSearch'");
    }
};

// 1. Lấy dữ liệu khách hàng từ API
async function fetchCustomers() {
    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch('https://k305jhbh09.execute-api.ap-southeast-1.amazonaws.com/customers', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 400 && errorData.message === "token expired") {
                await refreshToken();
                return;
            }
            throw new Error("Lỗi tải dữ liệu khách hàng");
        }

        customerList = await response.json();
        displayCustomers(customerList);

    } catch (error) {
        console.error('Lỗi khi tải khách hàng:', error);
    }
}

// 2. Hàm hiển thị dữ liệu khách hàng lên Table
function displayCustomers(customers) {
    const tableBody = document.getElementById('customerTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!customers || customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Không tìm thấy khách hàng nào</td></tr>';
        return;
    }

    customers.forEach(cust => {
        const row = document.createElement('tr');

        // Xác định màu sắc cho Badge Hạng
        const tierClass = cust.tier?.toLowerCase() || 'bronze';
        const avatarInitial = cust.name ? cust.name.charAt(0).toUpperCase() : 'C';

        row.innerHTML = `
            <td>
                <div class="cust-info">
                    <div class="avatar" style="background: #ebf5fb; color: #3498db;">${avatarInitial}</div>
                    <div>
                        <strong>${cleanString(cust.name)}</strong><br>
                        <small>ID: ${cust.id || 'N/A'}</small>
                    </div>
                </div>
            </td>
            <td>${cleanString(cust.email)}<br><small>${cleanString(cust.phone)}</small></td>
            <td><span class="tier ${tierClass}">${(cust.tier || 'ĐỒNG').toUpperCase()}</span></td>
            <td>${cust.orderCount || 0}</td>
            <td><strong>${formatCurrency(cust.totalSpent)}</strong></td>
            <td>
                <button class="btn-action" title="Lịch sử"><i class="fas fa-history"></i></button>
                <button class="btn-action" title="Sửa"><i class="fas fa-user-edit"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 3. Hàm tìm kiếm khách hàng (Tên, Email, Số điện thoại)
function searchCustomers(searchQuery) {
    // 1. Chuyển về chữ thường và xóa khoảng trắng thừa
    const query = searchQuery.toLowerCase().trim();

    // 2. Lọc danh sách
    const filtered = customerList.filter(cust => {
        // Kiểm tra kỹ các trường dữ liệu, đề phòng trường hợp bị null/undefined
        const name = cust.name ? String(cust.name).toLowerCase() : "";
        const email = cust.email ? String(cust.email).toLowerCase() : "";
        const phone = cust.phone ? String(cust.phone).toLowerCase() : "";
        const id = cust.id ? String(cust.id).toLowerCase() : "";

        // Trả về true nếu bất kỳ trường nào khớp với chuỗi tìm kiếm
        return name.includes(query) ||
            email.includes(query) ||
            phone.includes(query) ||
            id.includes(query);
    });

    // 3. Hiển thị lại bảng với danh sách đã lọc
    displayCustomers(filtered);
}

function cleanString(data) {
    return data ? String(data).trim() : '';
}

function formatCurrency(value) {
    if(!value) return "0đ";
    return Number(value).toLocaleString('vi-VN') + "đ";
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
            fetchCustomers();
        } else {
            window.location.href = '../Login/index.html';
        }
    } catch (e) {
        window.location.href = '../Login/index.html';
    }
}