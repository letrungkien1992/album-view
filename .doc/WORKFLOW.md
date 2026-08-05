# Development Workflow

## Khi bắt đầu một task mới

1. Đọc tài liệu trong thư mục .doc.
2. Xác định file backend/frontend liên quan.
3. Tìm root cause trước khi sửa.
4. Thực hiện thay đổi nhỏ, rõ ràng.
5. Verify bằng lệnh phù hợp.

## Workflow cho feature mới

- Nếu là feature UI: chỉnh HTML/CSS/JS trước, rồi nối API nếu cần.
- Nếu là feature backend: sửa index.php hoặc script, rồi verify.
- Nếu là feature build ảnh: kiểm tra scripts/ và output thư mục src/row, src/thumbs.

## Workflow cho bug fix

1. Reproduce issue.
2. Tìm file gây ra lỗi.
3. Fix nguyên nhân chứ không chỉ symptom.
4. Verify bởi test/command thực tế.

## Chuẩn deploy/production

- Chạy production setup sau deploy khi cần.
- Đảm bảo web user có quyền ghi vào storage/, resources/, src/albums, src/row, src/thumbs.
- Kiểm tra log build và lỗi permission nếu build fail.

## Useful commands

- `php -l index.php`
- `node --check resources/album-resource/album-viewer.js`
- `bash scripts/run-scripts.sh build-images`
- `bash scripts/prod-build-setup.sh`
