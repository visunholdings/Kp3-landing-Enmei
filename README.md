# Enmei Landing Page

Landing page giới thiệu ba sản phẩm dinh dưỡng Enmei:

- Enmei Gold Elder
- Enmei Bone+
- Enmei Diabetes

Kênh tiếp nhận tư vấn/đơn hàng hiển thị trên trang: form, Zalo, Messenger và email.

## Cấu trúc

Mã nguồn website hoàn chỉnh nằm trong thư mục `dist/`:

- `dist/index.html`: nội dung và cấu trúc trang
- `dist/styles.css`: giao diện responsive cho desktop, tablet và điện thoại
- `dist/script.js`: menu, FAQ, hiệu ứng và form tư vấn
- `dist/assets/`: hình ảnh ba sản phẩm

## Chạy trên máy tính

Có thể mở trực tiếp `dist/index.html` bằng trình duyệt hoặc chạy một static web server với thư mục xuất bản là `dist/`.

Không cần cài đặt package hoặc chạy bước build.

## Triển khai trên Vercel

Repository đã có `vercel.json` khai báo `dist/` là thư mục xuất bản. Khi kết nối repository với Vercel, chọn Framework Preset là `Other` và không cần Build Command.
