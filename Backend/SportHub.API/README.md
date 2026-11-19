# SportHub.API

Backend chính của **SportHub 2.0**, được refactor từ phiên bản Java Spring Boot (`com.sporthub.*`) sang **C# / ASP.NET Core 8 Web API** và **Entity Framework Core (SQL Server)** theo kiến trúc phân tầng chuẩn.

## Kiến trúc phân tầng (Layered Architecture)

```text
HTTP Request → Controller → Service → Repository / EF Core → SQL Server
                    ↕
               DTOs ↔ Models
```

```text
Backend/SportHub.API/
├── Controllers/                  # Tầng API điều phối HTTP request/response
│   ├── AuthController.cs         # Đăng ký, đăng nhập JWT, thông tin tài khoản (/api/auth)
│   ├── FieldController.cs        # CRUD sân, lọc/tìm kiếm, upload ảnh sân (/api/fields)
│   ├── BookingController.cs      # Đặt sân chống trùng lịch, giữ chỗ, huỷ lịch (/api/bookings)
│   ├── AdminController.cs        # Quản trị booking & thống kê doanh thu (/api/admin)
│   ├── MatchController.cs        # Trận giao lưu/thách đấu & bảng xếp hạng Elo (/api/matches)
│   └── ClaimsPrincipalExtensions.cs
├── Models/                       # Entity ánh xạ bảng SQL Server qua EF Core
│   ├── User.cs
│   ├── UserRole.cs
│   ├── Field.cs
│   ├── Booking.cs
│   └── Match.cs
├── Data/                         # DbContext & khởi tạo dữ liệu mẫu môi trường Dev
│   ├── SportHubDbContext.cs
│   └── DbInitializer.cs
├── DTOs/                         # Data Transfer Objects & DataAnnotations Validation
│   ├── FieldDto.cs
│   ├── BookingCreateDto.cs
│   ├── MatchCreateDto.cs
│   ├── AuthDtos.cs
│   ├── AdminRevenueSummaryResponseDto.cs
│   └── ApiErrorResponseDto.cs
├── Repositories/                 # Tầng truy vấn dữ liệu (Repository Pattern)
│   ├── IFieldRepository.cs & FieldRepository.cs
│   ├── IUserRepository.cs & UserRepository.cs
│   ├── IBookingRepository.cs & BookingRepository.cs
│   └── IMatchRepository.cs & MatchRepository.cs
├── Services/                     # Tầng xử lý nghiệp vụ & bảo mật JWT/BCrypt
│   ├── IFieldService.cs & FieldService.cs
│   ├── IAuthService.cs & AuthService.cs
│   ├── IBookingService.cs & BookingService.cs
│   ├── IAdminService.cs & AdminService.cs
│   ├── IMatchService.cs & MatchService.cs
│   ├── IJwtService.cs & JwtService.cs
│   └── IPasswordHasher.cs & LegacyAwarePasswordHasher.cs
├── Middleware/                   # Xử lý ngoại lệ tập trung & chuẩn hóa JSON TimeOnly
│   ├── ApiExceptionMiddleware.cs
│   └── FlexibleTimeOnlyJsonConverter.cs
├── wwwroot/uploads/fields/       # Lưu trữ ảnh sân upload tĩnh
├── appsettings.json
├── appsettings.Development.json
├── Program.cs                    # Điểm khởi chạy, DI Container, Auth, CORS, Swagger
└── SportHub.API.csproj
```

## Cấu hình bảo mật & Khởi chạy

1. Cấu hình connection string và JWT key bằng User Secrets hoặc biến môi trường; không lưu thông tin thật trong Git.
2. Khởi chạy dự án:

   ```powershell
   dotnet restore
   dotnet run
   ```

   - API mặc định lắng nghe tại: `http://localhost:8081`
   - Swagger UI (Development): `http://localhost:8081/swagger`
   - Health check: `http://localhost:8081/api/health` và `http://localhost:8081/api/fields/health`
   - Tài khoản Admin mặc định môi trường Development (`SeedSampleData = true`):
     - **Email:** `admin@sporthub.com`
     - **Mật khẩu:** `Admin@123`

### Đăng nhập/đăng ký bằng Google

SportHub dùng Google Identity Services ở frontend, xác minh ID token ở backend và sau đó vẫn cấp JWT SportHub. Tài khoản đăng ký mới qua Google được tạo với role `CUSTOMER`; tài khoản trùng email chỉ tự liên kết khi Google là nguồn xác minh email có thẩm quyền (Gmail hoặc Google Workspace). Backend lưu Google `sub` vào `users.google_sub` để nhận diện tài khoản ổn định.

1. Tạo OAuth Client ID loại **Web application** trong Google Cloud Console. Thêm origin của frontend đang chạy, thường là `http://127.0.0.1:5500` và `http://localhost:5500`.
2. Trong thư mục `Backend/SportHub.API`, lưu Client ID vào User Secrets:

   ```powershell
   dotnet user-secrets set "Google:ClientId" "YOUR_CLIENT_ID.apps.googleusercontent.com"
   ```

3. Với database đã tồn tại, chạy `Database/migrations/20261120_add_google_auth.sql` trong SSMS trên đúng database `SportHubDb`. Nếu khởi tạo database mới từ `Database/schema.sql`, cột và chỉ mục này đã có sẵn.
4. Khởi động lại API và tải lại trang frontend. Nút Google xuất hiện trong tab đăng nhập và đăng ký khi backend có Client ID.

Client ID là giá trị công khai được gửi tới trình duyệt; không dùng OAuth client secret ở frontend.

## Danh sách Endpoint chính

| Nhóm | Method & Route | Quyền truy cập | Mô tả |
|---|---|---|---|
| Auth | `POST /api/auth/register` | Public | Đăng ký tài khoản mới & cấp JWT |
| Auth | `POST /api/auth/login` | Public | Đăng nhập & cấp JWT |
| Auth | `GET /api/auth/google/config` | Public | Trả trạng thái cấu hình và Google Web Client ID công khai cho nút Google |
| Auth | `POST /api/auth/google` | Public | Xác minh Google ID token, đăng ký/đăng nhập và cấp JWT SportHub |
| Auth | `GET /api/auth/me` | Authenticated | Lấy hồ sơ người dùng hiện tại |
| Auth | `PUT /api/auth/me/profile` | Authenticated | Cập nhật tên, điện thoại, địa chỉ và bio của tài khoản hiện tại |
| Auth | `POST /api/auth/me/avatar` | Authenticated | Upload ảnh đại diện JPG/PNG/WebP, tối đa 2 MB |
| Fields | `GET /api/fields` | Public | Danh sách tất cả sân |
| Fields | `GET /api/fields/available` | Public | Danh sách sân đang mở đặt |
| Fields | `GET /api/fields/{id}` | Public | Chi tiết sân theo ID |
| Fields | `GET /api/fields/city/{city}` | Public | Lọc sân khả dụng theo thành phố |
| Fields | `GET /api/fields/sport/{sportType}` | Public | Lọc sân khả dụng theo môn thể thao |
| Fields | `GET /api/fields/search` | Public | Tìm kiếm đa tiêu chí (city, sportType, giá, tiện ích, khung giờ trống) |
| Fields | `POST /api/fields` | `ADMIN`, `OWNER` | Tạo sân mới |
| Fields | `PUT /api/fields/{id}` | `ADMIN`, `OWNER` | Cập nhật thông tin sân |
| Fields | `POST /api/fields/{id}/image` | `ADMIN`, `OWNER` | Upload ảnh sân vào `wwwroot/uploads/fields/` |
| Fields | `DELETE /api/fields/{id}` | `ADMIN` | Xóa sân |
| Bookings | `GET /api/bookings/field/{fieldId}` | Public | Xem lịch đã đặt của một sân |
| Bookings | `GET /api/bookings/me` | Authenticated | Lịch đặt sân của tôi |
| Bookings | `POST /api/bookings` | Authenticated | Đặt sân / giữ chỗ (kiểm soát xung đột qua `Serializable` transaction) |
| Bookings | `PUT /api/bookings/{bookingId}` | Owner / `ADMIN` | Cập nhật thời gian, sân và thông tin liên hệ; kiểm tra lại xung đột |
| Bookings | `PATCH /api/bookings/{bookingId}/cancel` | Owner / `ADMIN` | Hủy lượt đặt sân |
| Bookings | `GET /api/bookings` | `ADMIN` | Truy vấn toàn bộ booking |
| Admin | `GET /api/admin/bookings` | `ADMIN` | Quản lý danh sách booking |
| Admin | `GET /api/admin/revenue/summary` | `ADMIN` | Tổng hợp số lượng & doanh thu |
| Admin users | `GET /api/admin/users` | `ADMIN` | Xem danh sách tài khoản và role (không trả mật khẩu) |
| Admin users | `PATCH /api/admin/users/{id}/role` | `ADMIN` | Đổi role `CUSTOMER`, `OWNER` hoặc `ADMIN`; người dùng cần đăng nhập lại |
| Admin | `PATCH /api/admin/bookings/{bookingId}/confirm` | `ADMIN` | Xác nhận booking |
| Admin | `PATCH /api/admin/bookings/{bookingId}/reject` | `ADMIN` | Từ chối booking đang chờ và gửi thông báo cho người đặt |

Các cột `bio` và `avatar_url` được thêm tự động khi khởi chạy môi trường Development. Với môi trường khác, chạy `Database/migrations/20261119_add_user_profile_fields.sql` một lần trước khi chạy phiên bản mới.
| Owner | `GET /api/owner/bookings` | `OWNER` | Xem booking thuộc các sân do chủ sân sở hữu |
| Owner | `PATCH /api/owner/bookings/{bookingId}/confirm` | `OWNER` | Xác nhận booking của sân mình; backend kiểm tra xung đột |
| Owner | `PATCH /api/owner/bookings/{bookingId}/reject` | `OWNER` | Từ chối booking của sân mình và gửi thông báo cho người đặt |
| Notifications | `GET /api/notifications/me` | Authenticated | Xem tối đa 50 thông báo gần nhất của tài khoản |
| Notifications | `PATCH /api/notifications/{id}/read` | Authenticated | Đánh dấu thông báo của chính tài khoản đã đọc |

Admin Dashboard có mục **Tài khoản & phân quyền** để đổi role; khi chỉnh sửa sân, admin cũng có thể gán hoặc bỏ gán OWNER cho sân. Chủ sân chỉ xem sân/booking được gán đúng `owner_id`.
| Matches | `GET /api/matches` | Public | Danh sách trận giao lưu/thách đấu |
| Matches | `POST /api/matches` | Authenticated | Tạo trận giao lưu mới |
| Matches | `POST /api/matches/{id}/join` | Authenticated | Tham gia trận đấu đang mở |
| Matches | `PATCH /api/matches/{id}/result` | Host / `ADMIN` | Ghi nhận tỉ số & cập nhật điểm Elo |
| Matches | `GET /api/matches/leaderboard` | Public | Bảng xếp hạng Elo khu vực |
