# Album Viewer Scripts Guide

Project này dùng các script trong thư mục `scripts/` để chạy server, build ảnh thumbnail/row, và setup domain.

## Cấu trúc scripts

- `scripts/run-scripts.sh`
  - Script quản lý trung tâm để list và chạy các script theo tên.
  - Dùng khi bạn muốn thao tác nhanh, không cần nhớ file cụ thể.

- `scripts/start-server.sh`
  - Khởi động PHP built-in server ở nền.
  - Đọc cấu hình từ `.env` (`APP_PORT`, `APP_HOST`/`DOMAIN`, `PHP_BIN`).
  - Ghi PID vào `.server.pid`, log vào `.server.log`.

- `scripts/stop-server.sh`
  - Dừng server đang chạy dựa trên `.server.pid` hoặc process đang listen theo `APP_PORT`.

- `scripts/build-album-images.sh`
  - Lệnh build ảnh tiện dụng khi bạn thêm album/ảnh mới.
  - Gọi `convert-images-webp.sh` để tạo ảnh trong:
    - `src/row`
    - `src/thumbs`

- `scripts/convert-images-webp.sh`
  - Script convert ảnh gốc trong `src/albums` sang `.webp` cho `row` và `thumbs`.
  - Có cơ chế **incremental**:
    - Ảnh đã build và không đổi sẽ `SKIP`.
    - Chỉ convert ảnh mới hoặc ảnh source mới hơn output.

- `scripts/build-deploy-zip.sh`
  - Đóng gói `deploy.zip` để upload lên hosting.

- `scripts/setup-domain.sh`
  - Script setup deploy domain (Nginx + service + SSL) theo `.env`.
  - Hỗ trợ:
    - Debian/Ubuntu: `apt + systemd + nginx + certbot`
    - macOS: `brew + launchd + nginx + certbot`
  - Có kiểm tra package đã cài chưa trước khi cài thêm.
  - Chạy nhiều lần an toàn (idempotent).

- `scripts.json`
  - File map lệnh scripts theo dạng cấu hình.
  - Dùng để tham chiếu nhanh các command chuẩn.

## Cách dùng nhanh

### 1) Xem danh sách lệnh

```bash
bash scripts/run-scripts.sh list
```

### 2) Start / Stop / Restart server

```bash
bash scripts/run-scripts.sh start-server
bash scripts/run-scripts.sh stop-server
bash scripts/run-scripts.sh restart-server
```

### 3) Build lại ảnh sau khi thêm album mới

```bash
bash scripts/run-scripts.sh build-images
bash scripts/run-scripts.sh build-deploy-zip
```

hoặc chạy trực tiếp:

```bash
bash scripts/build-album-images.sh
```

### 4) Setup domain trên server

Linux (Debian/Ubuntu):
```bash
sudo bash scripts/setup-domain.sh
```

macOS:
```bash
bash scripts/setup-domain.sh
```

## Cấu hình `.env`

Script sử dụng `.env` ở root project. Các biến quan trọng:

- `DOMAIN`
- `EMAIL`
- `APP_PORT`
- `APP_HOST` (optional, nếu không có sẽ dùng `DOMAIN` rồi fallback `localhost`)
- `PHP_BIN`
- `PHP_BIN`
- `PROJECT_PATH`
- `SOURCE_DIR`
- `ENABLE_SSL`
- `ENABLE_WWW`

## Ghi chú

- Sau khi thêm ảnh mới vào `src/albums`, luôn chạy build ảnh để UI load nhanh.
- Nếu script báo thiếu `cwebp`, cài package `webp` trước.
