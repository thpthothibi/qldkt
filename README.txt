HTB - KIỂM THỬ AUTH /me

1. Trên GitHub repository thpthothibi/qldkt, tạo thư mục auth-test.
2. Tải index.html trong gói này vào thư mục auth-test/index.html.
3. Mở https://thpthothibi.github.io/qldkt/auth-test/
4. Nhập email và mật khẩu Appwrite Auth của quản trị viên (KHÔNG gửi cho ChatGPT).
5. Nếu thành công hiển thị 'Worker xác minh được quyền admin'.
6. Nhấn Đăng xuất rồi XÓA thư mục auth-test khỏi GitHub sau khi hoàn tất.

Yêu cầu: Worker POST /me nhận Authorization: Bearer <Appwrite JWT> và CORS cho https://thpthothibi.github.io.
Chưa dùng cho nhập điểm hay triển khai thật. Trang KHÔNG lưu mật khẩu/JWT vào localStorage.

Nếu giao diện báo lỗi CORS, kiểm tra Worker phải xử lý OPTIONS và Access-Control-Allow-Headers: Content-Type, Authorization.
Nếu lỗi 401, kiểm tra phiên Appwrite Auth và xác minh JWT trong Worker.
Nếu lỗi 403, kiểm tra users.authUserId, active, role.
