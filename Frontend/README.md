# SportHub Frontend

Frontend hiện tại sử dụng HTML, CSS và JavaScript thuần, gọi `SportHub.API` bằng JSON.

## Cấu trúc

```text
Frontend/
├── index.html              # Trang tìm kiếm sân, đăng nhập và tạo booking
├── matches.html            # Trang tìm đối thủ giao hữu và bảng xếp hạng Elo
├── admin.html              # Trang quản trị sân, booking và doanh thu
├── my-bookings.html        # Booking hiện tại và lịch sử của customer
├── css/
│   ├── style.css           # Entry point, import các stylesheet theo thứ tự
│   ├── base.css            # Reset, design tokens chuẩn WCAG AA và layout nền
│   ├── components.css      # Button, card, bảng, modal, skeleton và toast
│   ├── auth-chat.css       # Authentication modal và trợ lý gợi ý sân
│   ├── home.css            # Hero search-first, bộ lọc nâng cao và thẻ sân
│   ├── bookings.css        # Thành phần trang lịch booking cá nhân
│   ├── admin.css           # Operations workspace, biểu đồ và drawer quản trị
│   └── matches.css         # Giao diện tìm đối thủ và bảng xếp hạng Elo
└── js/
	├── config.js           # Đọc cấu hình API base URL và origin
	├── shared.js           # Tiện ích dùng chung, auth modal, navbar và SVG fallback
	├── main.js             # Trang chủ, tìm kiếm/lọc sân, timeline slot và booking
	├── home-ui.js          # Chip môn thể thao và bộ lọc nâng cao trang chủ
	├── matches.js          # Tạo kèo, nhận kèo, nhập tỷ số và bảng xếp hạng Elo
	├── admin.js            # Chức năng quản trị, analytics và upload ảnh sân
	└── my-bookings.js      # Cập nhật, hủy và hiển thị lịch booking cá nhân
```

## Chạy local

1. Khởi động backend bằng profile HTTP:

   ```powershell
   dotnet run --project Backend/SportHub.API --launch-profile http
   ```

2. Phục vụ thư mục repository bằng một static web server, ví dụ Visual Studio Live Server hoặc:

   ```powershell
   python -m http.server 5500 --directory Frontend
   ```

3. Mở `http://localhost:5500`.

Frontend development mặc định gọi:

```text
http://localhost:8081/api
```

URL này được cấu hình trong `window.SPORTHUB_CONFIG` ở mỗi trang HTML. Khi triển khai môi trường khác, thay `apiBaseUrl` và thêm origin frontend vào `Cors:AllowedOrigins` của backend.

## API chính đang sử dụng

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/fields`
- `POST /api/bookings`
- `PUT /api/bookings/{id}` để cập nhật booking chưa hoàn tất/hủy
- `PATCH /api/bookings/{id}/cancel` để hủy booking
- `GET /api/bookings/me`
- Các endpoint quản trị `/api/admin/*`

Frontend không phải ranh giới tin cậy. Backend vẫn phải xác thực JWT, phân quyền, kiểm tra dữ liệu, khả dụng và xung đột booking.

