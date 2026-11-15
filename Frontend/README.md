# SportHub Frontend

Frontend hiện tại sử dụng HTML, CSS và JavaScript thuần, gọi `SportHub.API` bằng JSON.

## Cấu trúc

```text
Frontend/
├── index.html              # Trang tìm kiếm sân, đăng nhập và tạo booking
├── admin.html              # Trang quản trị sân, booking và doanh thu
├── my-bookings.html        # Booking hiện tại và lịch sử của customer
├── css/
│   ├── style.css           # Entry point, import các stylesheet theo thứ tự
│   ├── base.css            # Reset, biến giao diện và layout nền
│   ├── home.css            # Hero, bộ lọc và giao diện trang chủ
│   ├── components.css      # Card, bảng, modal và thành phần dùng chung
│   ├── auth-chat.css       # Authentication modal và chat panel
│   ├── admin.css           # Dashboard và biểu mẫu quản trị
│   └── bookings.css        # Thành phần trang lịch booking
└── js/
	├── main.js             # Trang chủ, authentication và tạo booking
	├── home-ui.js          # Chip/môn thể thao trên trang chủ
	├── admin.js            # Chức năng quản trị
	└── my-bookings.js      # Cập nhật, hủy và hiển thị booking của customer
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

