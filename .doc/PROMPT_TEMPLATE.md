# AI Prompt Template

Dùng mẫu này khi giao task cho một công cụ AI khác.

## Template

```text
Bạn đang làm việc trên dự án Album Viewer.

Ngữ cảnh:
- Project root: /Users/letrungkien/Project/2026/album-view
- Stack: PHP, HTML/CSS/JS, shell scripts
- Mục tiêu: sửa/thiết kế theo đúng flow hiện có

Yêu cầu:
1. Đọc trước tài liệu trong .doc/.
2. Hiểu cấu trúc project trước khi sửa.
3. Không phá flow rebuild ảnh, auth, permission production và admin-only actions.
4. Nếu sửa backend, đồng bộ frontend và ngược lại.
5. Sau khi sửa, chạy verify phù hợp:
   - php -l index.php
   - node --check resources/album-resource/album-viewer.js
6. Trả lời bằng ngắn gọn, nêu thay đổi và kết quả verify.
```

## Khi giao task cụ thể

- Nêu rõ bug/feature cần làm.
- Chỉ sửa file liên quan.
- Nếu có thay đổi API hoặc dữ liệu, nêu rõ.
- Tránh làm thay đổi lớn không cần thiết.
