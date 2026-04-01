
    // Biến toàn cục để lưu danh sách sản phẩm
    let productList = [];

    // 1. Kiểm tra xem người dùng đã đăng nhập hay chưa Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    window.onload = function() {
    const accessToken = localStorage.getItem('access_token');
    const loggedIn = localStorage.getItem('loggedIn');

    if (!accessToken || loggedIn !== 'true') {
    window.location.href = '../Login/index.html';
} else {
    fetchProducts();
}

    // 2. Lắng nghe sự kiện tìm kiếm
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
    searchInput.addEventListener('input', (e) => {
    searchProducts(e.target.value);
});
}
};

    // 3. Lấy dữ liệu từ API
    async function fetchProducts() {
    const token = localStorage.getItem('access_token');
    try {
    const response = await fetch('https://k305jhbh09.execute-api.ap-southeast-1.amazonaws.com/products', {
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
    throw new Error("Lỗi tải dữ liệu");
}

    productList = await response.json();
    displayProducts(productList); // Hiển thị lần đầu

} catch (error) {
    console.error('Lỗi khi tải sản phẩm:', error);
}
}

    // 4. Hàm làm mới token
    async function refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
    alert('Vui lòng đăng nhập lại.');
    window.location.href = '../Login/index.html';  // Chuyển hướng người dùng đến trang đăng nhập
    return;
}

    try {
    // Gửi yêu cầu làm mới token
    const response = await fetch('https://k305jhbh09.execute-api.ap-southeast-1.amazonaws.com/refresh-token', {
    method: 'POST',
    headers: {
    'Authorization': `Bearer ${refreshToken}`,
    'Content-Type': 'application/json',
},
});

    if (!response.ok) {
    throw new Error('Không thể làm mới token.');
}

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);  // Lưu token mới vào localStorage
    console.log('Token mới đã được lấy');
    fetchProducts();  // Sau khi làm mới token, gọi lại fetchProducts để lấy dữ liệu sản phẩm
} catch (error) {
    console.error('Lỗi khi làm mới token:', error);
    alert('Không thể làm mới token, vui lòng đăng nhập lại.');
    window.location.href = '../Login/index.html';  // Chuyển hướng người dùng đến trang đăng nhập
}
}

    // 5. Hàm hiển thị dữ liệu lên Table
    function displayProducts(products) {
    const productTableBody = document.getElementById('productTableBody');
    if (!productTableBody) return;

    productTableBody.innerHTML = '';

    if (!products || products.length === 0) {
    productTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Không tìm thấy sản phẩm nào</td></tr>';
    return;
}

    products.forEach(product => {
    const row = document.createElement('tr');
    row.innerHTML = `
    <td><img src="${product.imageUrl || 'https://via.placeholder.com/50'}" alt="sp" class="img-thumb"></td>
    <td>
        <strong>${cleanString(product.name)}</strong><br>
        <small>SKU: ${cleanString(product.sku)}</small>
    </td>
    <td>${cleanString(product.category) || 'Chưa có danh mục'}</td>
    <td>${formatCurrency(product.price)}</td>
    <td>${product.remaining || 0}</td>
    <td>
        <button class="btn-icon edit"><i class="fas fa-edit"></i></button>
        <button class="btn-icon delete"><i class="fas fa-trash"></i></button>
    </td>
  `;
    productTableBody.appendChild(row);
});
}

    // Dọn dẹp chuỗi
    function cleanString(data) {
    if (data === null || data === undefined) return '';

    if (typeof data === 'object') {
    return data.name || data.title || JSON.stringify(data);
}

    return String(data).trim();
}

    // hàm tìm kiếm sản phẩm
    function searchProducts(searchQuery) {
    const query = searchQuery.toLowerCase().trim();

    const filteredProducts = productList.filter(product => {
    const name = cleanString(product.name).toLowerCase();
    const sku = cleanString(product.sku).toLowerCase();
    const category = cleanString(product.category).toLowerCase();

    return name.includes(query) ||
    sku.includes(query) ||
    category.includes(query);
});

    displayProducts(filteredProducts);
}

    // Định dạng tiền tệ
    function formatCurrency(value) {
    if(!value) return "0đ";
    return Number(value).toLocaleString('vi-VN') + "đ";
}
