//
// document.addEventListener("DOMContentLoaded", function() {
//   // Lấy các phần tử cần thiết
//   const searchInput = document.getElementById('searchInput');
//   const productTableBody = document.getElementById('productTableBody');
//
//   // Danh sách sản phẩm (Dữ liệu mẫu - giả sử bạn lấy từ API)
//   const products = [
//     {
//       name: "iPhone 15 Pro",
//       sku: "IP15P-01",
//       category: "Điện thoại",
//       price: "28.900.000đ",
//       stock: 45,
//       image: "https://picsum.photos/50"
//     },
//     {
//       name: "Tai nghe AirPods Pro",
//       sku: "AP-02",
//       category: "Phụ kiện",
//       price: "5.500.000đ",
//       stock: 3,
//       image: "https://picsum.photos/51"
//     },
//     {
//       name: "iPhone 14 Pro",
//       sku: "IP15P-02",
//       category: "Điện thoại",
//       price: "25.900.000đ",
//       stock: 46,
//       image: "https://picsum.photos/50"
//     },
//     {
//       name: "iPhone 16 Pro",
//       sku: "IP15P-03",
//       category: "Điện thoại",
//       price: "30.900.000đ",
//       stock: 47,
//       image: "https://picsum.photos/50"
//     },
//     // Thêm các sản phẩm khác tại đây
//   ];
//
//   // Hàm hiển thị các sản phẩm lên bảng
//   function displayProducts(filteredProducts) {
//     productTableBody.innerHTML = ''; // Xóa bảng cũ trước khi hiển thị lại
//
//     filteredProducts.forEach(product => {
//       const row = document.createElement('tr');
//
//       // Thêm các cột vào bảng
//       row.innerHTML = `
//       <td><img src="${product.image}" alt="sp" class="img-thumb"></td>
//       <td><strong>${product.name}</strong><br><small>SKU: ${product.sku}</small></td>
//       <td>${product.category}</td>
//       <td>${product.price}</td>
//       <td>${product.stock}</td>
//       <td>
//         <button class="btn-icon edit"><i class="fas fa-edit"></i></button>
//         <button class="btn-icon delete"><i class="fas fa-trash"></i></button>
//       </td>
//     `;
//
//       productTableBody.appendChild(row);
//     });
//   }
//
//   // Hàm tìm kiếm sản phẩm
//   function searchProducts() {
//     const query = searchInput.value.toLowerCase();  // Chuyển từ khóa tìm kiếm thành chữ thường
//     const filteredProducts = products.filter(product =>
//             product.name.toLowerCase().includes(query)  // Lọc sản phẩm dựa trên tên
//     );
//
//     displayProducts(filteredProducts);  // Hiển thị các sản phẩm đã lọc
//   }
//
//   // Lắng nghe sự kiện nhập liệu trong ô tìm kiếm
//   searchInput.addEventListener('input', searchProducts);
//
//   // Hiển thị toàn bộ sản phẩm khi trang được tải
//   displayProducts(products);
// });









document.getElementById('searchInput').addEventListener('input', async function(event) {
  const searchQuery = event.target.value.trim();  // Lấy từ khóa tìm kiếm từ ô input

  if (searchQuery === '') return;  // Không thực hiện tìm kiếm nếu ô tìm kiếm trống

  const token = localStorage.getItem('access_token');  // Lấy Access Token từ localStorage
  if (!token) {
    alert('Vui lòng đăng nhập để tiếp tục.');
    window.location.href = '../Login/index.html';  // Chuyển hướng về trang đăng nhập
    return;
  }

  try {
    // Gửi yêu cầu tìm kiếm tới API
    const response = await fetch(`https://k305jhbh09.execute-api.ap-southeast-1.amazonaws.com/products?search=${encodeURIComponent(searchQuery)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Không thể tải dữ liệu sản phẩm');
    }

    const data = await response.json();
    displayProducts(data);  // Gọi hàm hiển thị sản phẩm

  } catch (error) {
    console.error('Lỗi khi tìm kiếm sản phẩm:', error);
    alert('Không thể tìm kiếm sản phẩm, vui lòng thử lại.');
  }
});

// Hàm hiển thị sản phẩm lên giao diện
function displayProducts(products) {
  const productList = document.getElementById('productList');
  productList.innerHTML = '';  // Xóa danh sách sản phẩm cũ

  if (products.length === 0) {
    productList.innerHTML = '<li>Không tìm thấy sản phẩm nào</li>';
    return;
  }

  products.forEach(product => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="product">
        <img src="${product.imageUrl || 'https://via.placeholder.com/50'}" alt="sp" class="img-thumb">
        <div class="product-info">
          <strong>${product.name}</strong><br>
          <small>SKU: ${product.sku}</small><br>
          <span>Danh mục: ${product.category || 'Chưa có danh mục'}</span><br>
          <span>Giá bán: ${product.price} VND</span><br>
          <span>Tồn kho: ${product.remaining}</span>
        </div>
      </div>
    `;
    productList.appendChild(li);
  });
}
















