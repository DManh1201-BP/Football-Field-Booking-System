# Database

Thư mục này chứa schema SQL Server của SportHub 2.0. Theo architecture blueprint, `schema.sql` là nguồn schema theo hướng Database-First; entity và `SportHubDbContext` trong `Backend/SportHub.API` cần được scaffold/cập nhật nhất quán từ schema.

## Quy tắc

- Tạo thay đổi schema có thể lặp lại và review được; ghi rõ thứ tự chạy nếu tách nhiều script.
- Định nghĩa khóa chính, khóa ngoại, ràng buộc và chỉ mục phù hợp với truy vấn.
- Đặt ràng buộc phía database cho dữ liệu cần duy nhất/toàn vẹn; kiểm tra xung đột booking không chỉ dựa vào UI.
- Không đưa dữ liệu cá nhân thật, thông tin thanh toán, mật khẩu hoặc secret vào script mẫu.
- Ghi chú cách cập nhật EF Core models/`DbContext` sau mỗi thay đổi schema.

## Khởi tạo database local

1. Mở SQL Server Management Studio hoặc Azure Data Studio và kết nối tới SQL Server local.
2. Mở file `Database/schema.sql` và chạy toàn bộ script. Script sẽ tạo database `SportHubDb`, các bảng `Users`, `Fields`, `Bookings`, `Matches`, index, ràng buộc và dữ liệu mẫu giả lập.
3. Nếu SQL Server dùng instance khác `localhost`, sửa giá trị `Server=` trong `Backend/SportHub.API/appsettings.json`. Ví dụ với SQL Server Express: `Server=.\SQLEXPRESS`.
4. Không sử dụng dữ liệu mẫu hoặc giá trị `PasswordHash` placeholder trong môi trường production.

### Nâng cấp database đã tồn tại

Nếu database `SportHubDb` đã được tạo trước khi có tính năng thông báo, không chạy lại toàn bộ schema. Mở `migrations/20261119_add_notifications.sql` trong SSMS, chọn đúng database `SportHubDb` và chạy một lần để tạo bảng `notifications` cùng index. Script có kiểm tra tồn tại nên có thể chạy lại an toàn.

Để bật đăng nhập/đăng ký Google trên database đã có, chạy `migrations/20261120_add_google_auth.sql` một lần trên `SportHubDb`. Script thêm `users.google_sub` và unique filtered index để liên kết Google account ổn định; script có thể chạy lại an toàn.

## Kết nối API

Connection string mặc định trong `appsettings.json` dùng Windows Authentication:

```text
Server=localhost;Database=SportHubDb;Trusted_Connection=True;MultipleActiveResultSets=True;TrustServerCertificate=True
```

Không commit connection string có tài khoản/mật khẩu thật. Với môi trường khác, dùng biến môi trường hoặc User Secrets.

## Quy trình Database-First

Sau khi schema ổn định, scaffold entity và `DbContext` từ database bằng EF Core Tools, sau đó đặt các file sinh ra vào `Backend/SportHub.API/Models` và `Backend/SportHub.API/Data`. Mọi thay đổi schema cần cập nhật `schema.sql` trước, chạy kiểm tra trên database local rồi scaffold/cập nhật lại mã nguồn.
