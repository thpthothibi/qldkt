# HTB - Staging website nhập điểm, Cloudflare + Appwrite

**Phiên bản thử nghiệm đọc dữ liệu, chưa dùng dữ liệu học sinh thật.** Không thay `index.html` gốc của website.

## Triển khai

1. Giữ nguyên Cloudflare Worker đang chạy (đã kiểm thử `health`, `bootstrap`, `list`). Không thay key.
2. Giải nén ZIP. Tải **nguyên thư mục `staging/`** lên đường dẫn `/staging/` của repository `thpthothibi/qldkt`. Chỉ cần 4 file `index.html`, `app.js`, `bridge.js`, `config.js`.
3. Các tài nguyên CSS/logo/Excel dùng lại từ thư mục gốc: `../style.css`, `../clean.css`, `../ui.css`, `../school-logo.png`, `../xlsx.full.min.js`. Các file này PHẢI có sẵn trên GitHub. Không đổi tên.
4. Mở https://thpthothibi.github.io/qldkt/staging/ qua cửa sổ ẩn danh, đăng nhập EMAIL + mật khẩu Appwrite Auth. Không dùng điện thoại ở bước này.
5. Vào menu `Nhập điểm`, `Phiếu đã lưu`, `Thiết lập`; xác nhận tài khoản đúng vai trò, danh mục hiển thị và dữ liệu ban đầu đều rỗng.
6. Đây là giai đoạn tích hợp xem dữ liệu: các chức năng `Lưu điểm`, `Lưu & xác nhận`, `Nhập Excel`, `Đổi mật khẩu`, `Cấp tài khoản`, `Ký số` đã chặn có chủ ý để không ghi sai dữ liệu chưa nghiệm thu.

## Tốc độ và bảo mật

- Đăng nhập dựa trên Appwrite Auth; JWT tạo tạm, cache **chỉ trong RAM** tối đa 5 phút; không đặt API Key phía browser. Cookie phiên do Appwrite SDK quản lý.
- Origin đúng: https://thpthothibi.github.io.
- Thử nghiệm `list` hiện đọc thêm chi tiết cho tối đa 12 phiếu để không hiển thị số điểm sai; quá ngưỡng sẽ báo rõ. Production cần API báo cáo phân trang phía server.
- Không dùng PWA/ServiceWorker cho staging. ServiceWorker từ thư mục gốc hiện có thể ảnh hưởng trang con; nên kiểm thử trong cửa sổ ẩn danh sau khi đảm bảo cache đã xóa.
- Không tự ý xóa trang kiểm thử Auth hay index gốc. Khi nghiệm thu hoàn tất mới chuyển root và bật ghi.
- Từ giao diện, API ghi chưa được bật. Backend Worker vẫn có endpoint `saveRecord`: không dùng nó với dữ liệu thật khi chưa kiểm thử transaction trên Appwrite thật.

## Bước sau

Xây dựng/kiểm thử import Excel ánh xạ số phách, danh sách phòng, rồi kiểm thử ghi nháp vào giao dịch và đọc lại, kiểm tra quyền và xung đột, cuối cùng mới chuyển production.
