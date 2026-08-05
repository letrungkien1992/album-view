# Project Rules

## Quy tắc bắt buộc

### 1) Backend và frontend phải đồng bộ

- Nếu thay đổi API route như **albums**, **rebuild_album**, **upload**, **delete_album** thì phải đồng bộ frontend tương ứng.
- Nếu đổi payload JSON, phải cập nhật client và server cùng lúc.

### 2) Rebuild ảnh là tính năng cốt lõi

- Album upload mới hoặc rebuild phải tạo row/thumbs đúng cách.
- Không được bỏ qua flow queue build và polling reload.
- Khi album có ảnh nhưng thiếu row/thumbs thì hệ thống nên auto-check và rebuild.

### 3) Permission production là vấn đề quan trọng

- File JSON trong storage/ và resources/ cần writable trong production.
- Nếu sửa logic permission self-heal thì chỉ nên chạy trên POST requests, không nên làm trên mọi request.
- Không thay đổi logic permission mà làm giảm bảo mật hoặc tăng overhead không cần thiết.

### 4) Admin-only tính năng phải giữ đúng

- Các hành động như upload, rebuild album, delete album, quản lý thiệp/âm thanh chỉ dành cho admin.
- Khi sửa UI, phải kiểm tra role hiện tại trước khi hiện nút/hành động.

### 5) Verify sau mọi thay đổi

- Backend: `php -l index.php`
- Frontend JS: `node --check resources/album-resource/album-viewer.js`
- Nếu có thể, test flow bằng browser hoặc gọi API.

### 6) Không phá cấu trúc dữ liệu hiện tại

- Không đổi tên thư mục/route quan trọng mà không cập nhật toàn bộ code liên quan.
- Giữ các file JSON storage ổn định, tránh làm mất dữ liệu user.

### 7) Khi làm task mới

- Đọc trước code liên quan ở index.php, resources/album-resource/album-viewer.js và scripts/.
- Không sửa trực tiếp bằng cách đoán; hiểu root cause trước.
