# Album Viewer

## Scripts

Tất cả script nằm trong thư mục `scripts/`.

### Runner chính

- `scripts/run-scripts.sh`
  - Xem danh sách lệnh: `bash scripts/run-scripts.sh list`
  - Chạy lệnh: `bash scripts/run-scripts.sh <command>`

### Các script chính

- `scripts/start-server.sh`
  - Khởi động PHP built-in server theo `.env` (`APP_PORT`, `APP_HOST`/`DOMAIN`, `PHP_BIN`)

- `scripts/stop-server.sh`
  - Dừng server theo PID hoặc theo cổng trong `.env`

- `scripts/build-album-images.sh`
  - Build ảnh `row` + `thumbs` từ `src/albums`
  - Dùng sau khi thêm album/ảnh mới

- `scripts/build-deploy-zip.sh`
  - Đóng gói `deploy.zip` để upload lên hosting

- `scripts/convert-images-webp.sh`
  - Convert ảnh sang `.webp` cho `src/row` và `src/thumbs`
  - Có cơ chế incremental: ảnh đã build và chưa đổi sẽ tự `SKIP`

- `scripts/setup-domain.sh`
  - Setup deploy domain
  - Hỗ trợ:
    - Debian/Ubuntu: `apt + systemd + nginx + certbot`
    - macOS: `brew + launchd + nginx + certbot`

## Cấu hình `.env`

Biến quan trọng:

- `DOMAIN`
- `EMAIL`
- `APP_PORT`
- `APP_HOST` (optional)
- `PHP_BIN`
- `PHP_BIN`
- `PROJECT_PATH`
- `SOURCE_DIR`
- `ENABLE_SSL`
- `ENABLE_WWW`

## Chạy nhanh

```bash
bash scripts/run-scripts.sh start-server
bash scripts/run-scripts.sh stop-server
bash scripts/run-scripts.sh restart-server
bash scripts/run-scripts.sh build-images
bash scripts/run-scripts.sh build-deploy-zip
```

Setup domain:

- Linux (Debian/Ubuntu):
```bash
sudo bash scripts/setup-domain.sh
```

- macOS:
```bash
bash scripts/setup-domain.sh
```

## Deploy Shared Hosting (DirectAdmin / Apache + PHP)

Project đã có sẵn:

- `index.php`:
  - Route `/` -> load `resources/album-resource/album-viewer.html`
  - API `GET /__albums__`
  - API `GET /__download__?album=...`
  - Chuyển `index.html` và `.html` về `/`
- `.htaccess`:
  - `DirectoryIndex index.php`
  - Rewrite request vào `index.php`
  - Tắt directory listing (`Options -Indexes`)

Các bước:

1. Upload toàn bộ source vào `public_html`.
2. Bảo đảm host bật:
   - `mod_rewrite`
   - PHP extension `ZipArchive`
   - PHP extension `GD` + `imagewebp`
3. Truy cập domain:
   - Trang chủ: `/`
   - Test API: `/__albums__`
