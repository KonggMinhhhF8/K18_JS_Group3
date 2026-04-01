document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Ngừng hành động mặc định của form (tránh tải lại trang)

    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('https://k305jhbh09.execute-api.ap-southeast-1.amazonaws.com/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        });

        // Kiểm tra nếu đăng nhập thành công
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Lỗi đăng nhập:', errorData);
            throw new Error(errorData.message || 'Đăng nhập thất bại');
        }

        // Parse dữ liệu từ API (Access Token và Refresh Token)
        const data = await response.json();
        console.log('Đăng nhập thành công:', data);

        // Lưu Access Token và Refresh Token vào localStorage
        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        localStorage.setItem('loggedIn', 'true');  // Đánh dấu trạng thái đăng nhập

        // Chuyển hướng người dùng đến trang chính sau khi đăng nhập thành công
        window.location.href = '../index.html';  // Đảm bảo đường dẫn đúng

    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        document.getElementById('error-message').style.display = 'block';  // Hiển thị thông báo lỗi
        document.getElementById('error-message').innerHTML = error.message;  // In chi tiết lỗi
    }
});