# Known Issues and Fixes

## 1) Missing album name on rebuild

- Lỗi xảy ra khi route **rebuild_album** nhận album rỗng.
- Fix: cho phép rebuild toàn bộ khi album không được cung cấp, nhưng vẫn validate nếu tên album không hợp lệ.
- File liên quan: index.php

## 2) Permission issues in production

- JSON files trong storage/ hoặc resources/ có thể mất quyền ghi sau deploy.
- Fix: dùng script production setup và logic self-heal trên POST requests.
- File liên quan: index.php, scripts/prod-build-setup.sh

## 3) Missing row/thumbs assets after upload

- Sau upload hoặc reload album, các file row/thumbs có thể chưa được tạo.
- Fix: auto-check và queue rebuild nếu assets missing.
- File liên quan: index.php

## 4) Admin-only actions visibility

- Nút rebuild/upload/delete phải chỉ hiện cho admin.
- Fix: kiểm tra state.authRole trước khi hiện UI.
- File liên quan: resources/album-resource/album-viewer.js
