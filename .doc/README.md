# Album Viewer – AI/Agent Working Guide

Đây là thư mục tài liệu nội bộ cho các công cụ AI hoặc người làm tiếp dự án. Mục tiêu là giữ nguyên flow, logic và quy tắc sản phẩm khi làm việc ở bất kỳ công cụ nào khác.

## Mục đích

- Giữ logic dự án nhất quán giữa nhiều công cụ AI.
- Giảm lỗi do thay đổi không đúng flow.
- Cung cấp cấu trúc project, quy tắc phát triển và các tính năng chính.

## Tài liệu chính

- [PROJECT_RULES.md](PROJECT_RULES.md): quy tắc bắt buộc khi chỉnh sửa project.
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md): cấu trúc thư mục và vai trò từng phần.
- [WORKFLOW.md](WORKFLOW.md): flow làm việc chuẩn cho phát triển, debug và deploy.
- [PROMPT_TEMPLATE.md](PROMPT_TEMPLATE.md): mẫu prompt khi giao task cho AI khác.
- [KNOWN_ISSUES_AND_FIXES.md](KNOWN_ISSUES_AND_FIXES.md): lỗi thường gặp và cách xử lý.
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md): checklist trước/sau deploy.

## Tóm tắt nhanh về dự án

- PHP backend: xử lý auth, upload, rebuild album, API JSON.
- Frontend: album viewer bằng HTML/CSS/JS.
- Dữ liệu: JSON trong storage/, resources/.
- Media build: tạo ảnh row/thumbs từ src/albums sang src/row, src/thumbs.
- Production concerns: permission write, rebuild background, admin actions.

## Nguyên tắc cốt lõi

1. Không làm sai flow rebuild ảnh và permission.
2. Luôn verify sau thay đổi bằng php -l / node --check khi phù hợp.
3. Nếu sửa API, cập nhật frontend và ngược lại.
4. Luôn giữ admin-only hành vi và auth logic.
5. Khi sửa production behavior, ưu tiên không làm phá flow hiện có.
