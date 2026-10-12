# HTB Quản lý điểm kiểm tra — giao diện xanh dương nhạt, v1.2

## Tải lên GitHub Pages

1. Giải nén HTB_QUAN_LY_DIEM_KIEM_TRA_V13_PWA.zip.
2. Mở repository GitHub dùng cho web này.
3. Chọn **Add file → Upload files**.
4. Mở thư mục **GITHUB_UPLOAD** trong gói đã giải nén. Chọn các tệp bên trong và kéo thả lên GitHub. Đặt **index.html ở ngay thư mục gốc của repository**; không tải nguyên thư mục GITHUB_UPLOAD thành một thư mục con.
5. Chọn **Commit changes**.
6. Vào **Settings → Pages → Build and deployment**.
7. **Source: Deploy from a branch**. **Branch: main**, thư mục **/(root)** → **Save**.
8. Chờ GitHub triển khai. Khi thành công, bấm **Visit site**. Đường dẫn thường là `https://TEN_TAI_KHOAN.github.io/TEN_REPOSITORY/`.
9. Nếu vẫn thấy màu cũ, nhấn Ctrl + F5 để tải lại giao diện.

Không cần npm, không cần build. Gói đã có thư viện đọc/ghi Excel. File .nojekyll có thể bị ẩn trên máy, nhưng ứng dụng vẫn hoạt động nếu bạn tải đủ các tệp thông thường.

## Sử dụng dữ liệu thật trên Google Drive

GitHub Pages trong gói này là trang xem thử và trang truy cập ứng dụng chính thức. **Không có API đăng nhập hoặc lưu điểm thật chạy tại GitHub.**

Để nhập điểm thật:

1. Cài ba file trong **GOOGLE_APPS_SCRIPT** vào Apps Script của trường: Code.gs, Crypto.gs, Index.html. Đọc **HUONG_DAN_GOOGLE_DRIVE.md** trong gói để làm từng bước.
2. Nếu đã cài bản trước, cập nhật cả **Code.gs** và **Index.html** mới để nhận giao diện xanh dương nhạt. Không chạy lại setupSchool_, không xóa dữ liệu hay Script properties. Triển khai **phiên bản mới** cho ứng dụng web hiện có.
3. Lấy URL Google Apps Script kết thúc bằng **/exec**.
4. Trong repository GitHub, mở **config.js** → bấm bút chì **Edit** và sửa:

```js
window.HTB_CONFIG = {
  mode: "live",
  appsScriptUrl: "https://script.google.com/macros/s/MA_TRIEN_KHAI_CUA_BAN/exec"
};
```

5. Thay toàn bộ URL ví dụ bằng URL `/exec` thật của bạn rồi **Commit changes**.
6. Sau khi GitHub cập nhật, người dùng mở đường dẫn GitHub, bấm **Mở ứng dụng nhập điểm** để mở URL Google Apps Script trong tab/cửa sổ riêng để đăng nhập và nhập điểm thật. Thanh địa chỉ chuyển sang Google; ứng dụng không gọi API trực tiếp xuyên miền và không nhúng iframe.

`mode: "demo"` chỉ chạy minh họa trong trình duyệt, không lưu Drive. `mode: "live"` mà thiếu hoặc sai URL sẽ hiện thông báo chưa cấu hình, không âm thầm quay về dữ liệu minh họa.

**Không tải file Excel tài khoản, danh sách học sinh, dữ liệu điểm, mật khẩu hay Script properties lên GitHub.** File config.js chỉ chứa chế độ và URL công khai của ứng dụng.

## Nội dung gói

- **GITHUB_UPLOAD/**: các tệp tải vào thư mục gốc của repository.
- **GOOGLE_APPS_SCRIPT/**: bộ mã chạy đăng nhập, nhập điểm và lưu Drive thật; giao diện đã đổi màu.
- **HUONG_DAN_GITHUB.md**: hướng dẫn này.
- **HUONG_DAN_GOOGLE_DRIVE.md**: cài backend và sử dụng toàn bộ chức năng.

## Thay đổi v1.2

- Menu bên trái, màn hình đăng nhập, nền trang và các bảng chuyển xanh dương nhạt.
- Nút chính và chữ dùng xanh đậm; thông báo lỗi vẫn đỏ, cảnh báo vẫn vàng.
- Giữ chức năng nhập điểm, tài khoản, nhập phách, phòng thi và báo cáo của v1.0.
- Thêm config.js và bộ khởi động dành cho GitHub Pages; không thay cơ chế xác thực hoặc lưu Drive phía server.
- Đã bỏ ký số. Lưu/xác nhận chỉ cần ít nhất một điểm hợp lệ; ảnh chữ ký tải lên được giữ cùng phiếu.
- Đã chèn logo trường và thiết kế mẫu in hai trang A4 (25 dòng/trang).
- Bổ sung tương phản màu xanh và đổi tên thành Quản lý điểm kiểm tra.

Đã kiểm tra cú pháp, tệp trong gói và logic chuyển trang (demo/live/URL không hợp lệ). Chưa kiểm tra trực quan bằng trình duyệt tự động; chưa triển khai vào repository GitHub hoặc tài khoản Google của trường vì chưa có đường dẫn và quyền truy cập.

Tài liệu GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Cập nhật v1.3 — điện thoại và PWA

- Menu xanh navy, tab đang chọn xanh sáng; tiêu đề bảng xanh đậm, nền trắng/xanh xen kẽ và nút chính rõ hơn.
- Điện thoại: menu trượt có lớp nền để đóng, vùng chạm lớn, ô nhập điểm 16px, bố cục một cột, thanh lưu có khoảng trống an toàn cho thiết bị có tai thỏ. Bảng báo cáo có thể vuốt ngang.
- Có manifest, icon logo trường 192/512px, nút cài ứng dụng và service worker hiển thị trang mất mạng. Đường dẫn tương đối tương thích GitHub Pages trong thư mục repository.
- **Thay đổi chế độ live:** trang GitHub không tự chuyển hướng ngay nữa. Nó hiển thị cổng truy cập với nút **Mở ứng dụng nhập điểm** và **Cài ứng dụng trên điện thoại**. Chức năng nhập điểm thật vẫn mở Apps Script trong cửa sổ/tab riêng; không phải ứng dụng nhập điểm PWA hoàn toàn trong cùng địa chỉ GitHub.
- Không lưu hoặc đồng bộ điểm ngoại tuyến. Service worker chỉ lưu trang thông báo mất mạng, không cache tài khoản, API, config hay điểm.
- Android: mở trang GitHub bằng Chrome, chọn nút cài nếu trình duyệt hỗ trợ. iPhone: mở bằng Safari → Chia sẻ → Thêm vào Màn hình chính. Việc hiện hộp thoại cài phụ thuộc trình duyệt.
- Chưa nghiệm thu trực tiếp trên Android/iPhone hoặc máy in thật. Đã kiểm tra cú pháp, cấu trúc manifest/tài nguyên, hành vi cổng live và phạm vi service worker.

Cập nhật toàn bộ tệp trong GITHUB_UPLOAD, bao gồm thư mục icons, giữ URL của trường trong config.js. Trên Apps Script cập nhật Index.html để nhận giao diện mobile mới và triển khai phiên bản mới; không chạy setupSchool_ lại.
