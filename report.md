# Báo Cáo Triển Khai Các User Case Thực Tế — SportHub

> **Phiên bản nền tảng:** Fast-forward từ `upstream/main` (`ecff5cc`)  
> **Ngày hoàn thành:** 23/11/2026  
> **Môi trường kiểm thử:** ASP.NET Core 8 Web API + SQL Server LocalDB (`(localdb)\MSSQLLocalDB / SportHubDb`) + Frontend Vanilla JS

---

## 1. Tổng Quan Các User Case Thực Tế & Cách Giải Quyết Đã Áp Dụng

### UC1. Không có Field Owner cung cấp sân tại khu vực (Cold-Start Supply)
- **Vấn đề thực tế:** Khi ở một khu vực chưa có chủ sân đăng ký làm đối tác (`OWNER`), người chơi không tìm thấy địa điểm để tạo kèo hoặc hẹn nhóm.
- **Cách giải quyết đã triển khai:**
  1. **Mô hình nguồn cung sân 3 tầng (`venue_source`):**
     - `PARTNER`: Sân đối tác có `owner_id` và đã được Admin xác thực (`APPROVED`), mở đầy đủ tính năng đặt sân online.
     - `COMMUNITY_UNCLAIMED`: Sân công cộng / sân phong trào chưa liên kết đặt lịch online (`verification_status = UNCLAIMED`). Hiển thị trên danh sách sân & tạo kèo để cộng đồng hẹn đấu, đồng thời ẩn nút đặt lịch online (thay bằng *"Tạo kèo tại sân này"* và *"Tôi là chủ sân (Claim)"*).
     - Địa điểm tự do trong Match (`field_id = null`): Cho phép người dùng tự nhập địa chỉ sân cơ quan/công viên khi tạo trận.
  2. **Người dùng đề xuất sân cộng đồng (`POST /api/fields/community-suggest`):** Bất kỳ tài khoản nào cũng có thể đề xuất sân công cộng mới (kèm tọa độ, địa chỉ). Sân vào hàng chờ `PENDING_REVIEW` để Admin duyệt công khai.
  3. **Luồng nhận quyền chủ sân (`Claim Venue`):** Chủ sân thật có thể gửi yêu cầu xác minh quyền sở hữu trên sân `COMMUNITY_UNCLAIMED` (`POST /api/fields/{id}/claim` kèm link bản đồ + upload giấy tờ). Khi Admin duyệt (`PATCH /api/admin/field-claims/{claimId}/review`), sân chuyển sang `PARTNER + APPROVED`, gán `owner_id`, và tự động nâng role người dùng thành `OWNER` (buộc đăng nhập lại để nhận JWT role mới).

---

### UC2. Xác thực Chủ sân & Phân biệt Sân Thật / Sân Giả (Duyệt nội bộ bởi Admin)
- **Vấn đề thực tế:** Nếu chỉ nhập tên và địa chỉ dạng văn bản rồi cho `OWNER` mở đặt sân ngay thì dễ phát sinh sân ma, sân trùng lặp hoặc mạo danh chủ sân.
- **Cách giải quyết đã triển khai (theo phương án Admin duyệt nội bộ):**
  1. **Mặc định chờ duyệt khi `OWNER` tạo sân:** Khi tài khoản `OWNER` gọi `POST /api/fields`, sân bắt buộc mang `verification_status = PENDING_REVIEW` và `is_available = false` (không hiển thị cho khách đặt), đồng thời gửi thông báo tới toàn bộ Admin.
  2. **Kiểm tra trùng tọa độ địa lý (Geo-Duplicate Detection):** Khi có `latitude` & `longitude`, hệ thống tính khoảng cách Haversine giữa sân mới và các sân cùng môn thể thao; nếu nằm trong bán kính **<= 50 mét**, hệ thống từ chối tạo trùng và hướng dẫn sử dụng luồng Claim sân sẵn có.
  3. **Upload hồ sơ chứng minh nội bộ (`POST /api/fields/{id}/verification-doc`):** Chủ sân tải lên ảnh chụp giấy phép/giấy tờ hoặc ảnh bảng giá tại sân (`.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf`, tối đa 8 MB) lưu tại thư mục riêng `App_Data/verification-documents` (ngoài `wwwroot`), kèm tọa độ `latitude/longitude` và `map_url`.
  4. **Tách DTO công khai (`PublicFieldDto`) & API tải tài liệu kiểm tra quyền từ DB:** Các API công khai (`GET /api/fields`, `/fields/{id}`, `/fields/available`, `/fields/search`, `/matches`, `/bookings`) chỉ trả `PublicFieldDto` (không chứa `VerificationDocUrl`, `VerificationNotes`, `HasVerificationDoc`). Tài liệu xác minh chỉ tải qua `GET /api/fields/{id}/verification-doc` hoặc `GET /api/admin/field-claims/{claimId}/evidence` với Bearer token và kiểm tra quyền trực tiếp từ DB (`Admin` hoặc đúng `Owner` sở hữu sân; khách/player/owner khác nhận `401`/`403`); đường dẫn tĩnh cũ `/uploads/verifications/*` bị chặn trả `404` và file cũ được di chuyển tự động sang `App_Data/verification-documents`.
  5. **Admin kiểm duyệt (`PATCH /api/admin/fields/{fieldId}/verify`):** Trong Admin Dashboard, Admin xem trực tiếp **Ảnh sân + Link tọa độ Google Maps + Hồ sơ/bảng giá (tải qua API bảo vệ)** để bấm `APPROVED` (tự động mở `is_available = true`) hoặc `REJECTED` (kèm lý do gửi thông báo về Chủ sân).
  6. **Cộng đồng báo cáo sân sai phạm (`POST /api/fields/{id}/report`):** Người dùng có thể báo cáo sân giả, sai giá, đã đóng cửa. Khi có từ **3 người dùng khác nhau** báo cáo ở trạng thái `OPEN`, hệ thống tự động gửi cảnh báo cho Admin; Admin có thể xử lý hoặc bấm **Tạm ngưng sân (`SUSPENDED`)**.

---

### UC3. Quản lý Số lượng Người Tham gia Đặt sân & Ghép trận (Hybrid 3 Chế độ)
- **Vấn đề thực tế:** Bắt toàn bộ đội phủi quen phải đăng ký tài khoản mới cho đặt sân sẽ làm giảm trải nghiệm, nhưng nếu chỉ 1 user đặt thì không quản lý được trận ghép lẻ nhiều người. Bên cạnh đó, DB cũ ràng buộc `CK_matches_missing_players BETWEEN 0 AND 1` và chỉ lưu 1 `challenger_user_id`.
- **Cách giải quyết đã triển khai:**
  1. **Đặt sân thường (`dbo.bookings`):** Chỉ cần **1 người đại diện** đăng nhập đặt sân; bổ sung trường `expected_players` và kiểm tra không vượt quá `fields.capacity`.
  2. **Gỡ giới hạn cũ trên `dbo.matches` & tách bảng `dbo.match_participants`:**
     - Cho phép 3 chế độ trận đấu (`match_mode`):
       - **`CUSTOM_PRIVATE` (Trận riêng tư):** Chỉ cần **1 Host** tạo để quản lý lịch/tỉ số nội bộ, trạng thái `MATCHED` ngay, không cần người lạ đăng ký slot.
       - **`TEAM_CHALLENGE` (Kèo 2 đội):** Chỉ cần **2 Đội trưởng** (`Host` & `Challenger`) đăng nhập đại diện cho mỗi đội.
       - **`SOLO_LOBBY` (Ghép lẻ từng vị trí):** **Bắt buộc từng người chơi đăng nhập** để đăng ký slot vào `match_participants` (hỗ trợ chọn phe `A`/`B`/`ANY`, hoặc khai báo `pre_reserved_slots` nếu đội Host đã có sẵn một số người và chỉ tuyển phần còn thiếu).
  3. **Quản lý Slot chặt chẽ:**
     - **Bảo lãnh `+1 Guest`:** Cho phép tối đa `guest_count = 1` do tài khoản chính bảo lãnh.
     - **Waitlist tự động:** Khi phòng đầy (`missing_players == 0`), người đến sau vào trạng thái `WAITLISTED`; khi có người rời phòng (`POST /api/matches/{id}/leave`), hệ thống tự động đôn người đầu hàng chờ lên `JOINED` và gửi thông báo.
     - **Anti-hoarding:** Chặn 1 user tham gia 2 trận đang hoạt động có khung giờ trùng nhau.
     - **Liên kết Booking ↔ Match (`booking_id`):** Cho phép tạo kèo trực tiếp từ một Booking sẵn có; nếu Booking bị hủy, từ chối hoặc hoãn mưa, toàn bộ thành viên đang tham gia Match được gửi thông báo cảnh báo tự động.

---

### UC4. Cập nhật Điểm Trận đấu & Elo Công bằng
- **Vấn đề thực tế:** Cơ chế cũ cho phép một mình Host nhập tỉ số và cộng/trừ Elo ngay lập tức, dẫn đến nguy cơ bịa tỉ số, nhập trước khi đá, farm Elo ở địa điểm giả hoặc dùng chung 1 điểm Elo cho mọi môn thể thao.
- **Cách giải quyết đã triển khai:**
  1. **Time-gate:** Không cho phép đề xuất tỉ số trước thời điểm `match_date + start_time` (trừ Admin).
  2. **Cơ chế Đồng thuận 2 chiều (Dual-Confirmation):**
     - **Bước 1 (`POST /api/matches/{id}/score/propose`):** Một bên đề xuất tỉ số -> `score_status = PENDING_CONFIRMATION`, đặt hạn `score_confirm_deadline = +24h`, chưa thay đổi Elo. Người gửi **không thể tự xác nhận** tỉ số của chính mình.
     - **Bước 2a (`POST /api/matches/{id}/score/confirm`):** Đối thủ xác nhận -> `score_status = CONFIRMED`, `status = COMPLETED`, lúc này mới tính Elo.
     - **Bước 2b (`POST /api/matches/{id}/score/dispute`):** Nếu sai lệch, đối thủ gửi khiếu nại kèm tỉ số đúng, lý do và ảnh bằng chứng (`POST /api/matches/{id}/dispute-evidence`) -> `score_status = DISPUTED`.
     - **Bước 3 (`PATCH /api/matches/{id}/score/resolve`):** Admin hoặc Chủ sân đã xác thực (`APPROVED`) của sân diễn ra trận đấu phân xử chốt tỉ số (`CONFIRM`) hoặc hủy tính điểm (`VOID`).
     - **Timeout Auto-Confirm:** Background service (`BookingMatchLifecycleService`) tự động chốt `AUTO_CONFIRMED` nếu quá 24h đối thủ không phản hồi/khiếu nại.
  3. **Elo riêng theo từng môn (`dbo.user_sport_ratings`):** Tách Elo theo `sport_type` (`FOOTBALL`, `BADMINTON`, `TENNIS`, `BASKETBALL`, `VOLLEYBALL`) kèm `matches_played`, `wins`, `draws`, `losses`. Bảng xếp hạng (`GET /api/matches/leaderboard?sportType=...`) hỗ trợ lọc theo môn.
  4. **Ranked vs Giao hữu & Chống Win-Trading:**
     - Chỉ trận tại sân `PARTNER + APPROVED` mới được bật `is_ranked = true`; kèo ở sân cộng đồng hoặc địa điểm tự nhập mặc định là Giao hữu (`is_ranked = false`, không tính Elo).
     - Với `SOLO_LOBBY`, tính biến động Elo theo **trung bình Elo Đội A vs Đội B**.
     - Giảm dần `K-factor` (`32 -> 8 -> 0`) nếu cùng 1 cặp đấu gặp lại `>= 2` trận ranked trong vòng 7 ngày.

---

### UC5. Các User Case Vận hành Sân, Thời tiết, Hủy lịch & Điểm Uy Tín
1. **Chống Double-Booking Online ↔ Khách vãng lai / Zalo (`Walk-in Block`):**
   - Chủ sân có API/UI `POST /api/owner/bookings/walk-in` để khóa khung giờ cho khách đặt ngoài hệ thống (`booking_type = WALK_IN`, `status = CONFIRMED`) trong cùng `Serializable` transaction với đặt online.
2. **Sửa lỗi trạng thái `PENDING` quá giờ (`CompleteElapsedBookingsAsync`):**
   - Trước đây booking `PENDING` (chưa từng được chủ sân duyệt) khi quá giờ vẫn bị chuyển thành `COMPLETED` và cộng vào doanh thu. Đã tách rõ: `CONFIRMED` quá giờ kết thúc -> `COMPLETED`; `PENDING` quá giờ bắt đầu -> `EXPIRED` (không tính doanh thu).
3. **Chính sách hủy theo mốc thời gian & Điểm uy tín (`reliability_score`, mặc định 100):**
   - Hủy booking `CONFIRMED` sát giờ `< 6h`: `-5` điểm uy tín; `6–24h`: `-2` điểm uy tín; `>= 24h`: miễn phạt.
   - Rời `SOLO_LOBBY` `< 2h` trước giờ đá: `-5` điểm uy tín.
   - Đánh dấu vắng mặt (`POST /api/matches/{id}/no-show/{targetUserId}`): `-15` điểm uy tín.
   - Tài khoản có `reliability_score < 50` bị chặn tham gia phòng ghép lẻ (`SOLO_LOBBY`).
   - Check-in sân (`PATCH /api/bookings/{id}/check-in`) và Check-in trận (`POST /api/matches/{id}/check-in`) được cộng `+1` điểm uy tín (tối đa 100).
4. **Bất khả kháng do thời tiết (`RAIN_OUT`):**
   - Chủ sân hoặc Admin có thể chuyển booking sân ngoài trời (`is_indoor = false`) sang trạng thái `RAIN_OUT` (`PATCH /api/owner/bookings/{id}/rain-out` hoặc `/api/admin/bookings/{id}/rain-out`) -> miễn phạt uy tín, hoàn trạng thái thanh toán (`REFUNDED`) và thông báo cho khách lẫn thành viên Match liên kết.
5. **Tác vụ nền định kỳ (`BookingMatchLifecycleService`):**
   - Chạy mỗi 60 giây để tự động giải phóng `HOLD` hết hạn, đóng `COMPLETED`/`EXPIRED`, và `AUTO_CONFIRMED` các tỉ số hết hạn 24h.

---

## 2. Danh Sách Các File Đã Thêm Mới & Chỉnh Sửa

### A. Database & Migration
| File | Trạng thái | Nội dung thay đổi / thêm mới |
|---|---|---|
| [schema.sql](file:///d:/My%20Application/SportHub/Database/schema.sql) | Sửa | Thêm `users.reliability_score`; thêm các cột xác thực/tọa độ/nguồn sân cho `fields`; thêm `booking_type`, `expected_players`, `deposit_amount`, `payment_status`, `cancellation_policy_applied`, `checked_in_at` và trạng thái `EXPIRED`, `RAIN_OUT` cho `bookings`; mở rộng `matches` (`match_mode`, `max_slots`, `pre_reserved_slots`, `booking_id`, `is_ranked`, `score_status`, proposed/disputed score) và nới `CK_matches_missing_players` thành `0..50`; thêm các bảng `field_claim_requests`, `field_reports`, `match_participants`, `user_sport_ratings`. |
| [20261123_real_world_usecases.sql](file:///d:/My%20Application/SportHub/Database/migrations/20261123_real_world_usecases.sql) | Thêm mới | Script migration idempotent nâng cấp CSDL SQL Server hiện có lên schema mới (dùng `ON DELETE NO ACTION` cho `FK_matches_booking` để tránh multiple cascade paths). |

### B. Backend — Models, Data & Background Service
| File | Trạng thái | Nội dung thay đổi / thêm mới |
|---|---|---|
| [User.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Models/User.cs) | Sửa | Thêm `ReliabilityScore` (`reliability_score`). |
| [Field.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Models/Field.cs) | Sửa | Thêm `VenueSource`, `VerificationStatus`, `Latitude`, `Longitude`, `MapUrl`, `VerificationDocUrl`, `VerificationNotes`, `VerifiedAt`, `VerifiedByAdminId`, `IsIndoor`. |
| [Booking.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Models/Booking.cs) | Sửa | Thêm `BookingType`, `ExpectedPlayers`, `DepositAmount`, `PaymentStatus`, `CancellationPolicyApplied`, `CheckedInAt`. |
| [Match.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Models/Match.cs) | Sửa | Thêm `MatchMode`, `MaxSlots`, `PreReservedSlots`, `BookingId`, `IsRanked`, `ScoreStatus`, các trường `Proposed*`/`Disputed*`, và navigation `Participants`. |
| [FieldClaimRequest.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Models/FieldClaimRequest.cs) | Thêm mới | Entity ánh xạ `dbo.field_claim_requests` cho luồng xin xác minh quyền sở hữu sân cộng đồng. |
| [FieldReport.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Models/FieldReport.cs) | Thêm mới | Entity ánh xạ `dbo.field_reports` cho luồng báo cáo sân giả/sai thông tin. |
| [MatchParticipant.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Models/MatchParticipant.cs) | Thêm mới | Entity ánh xạ `dbo.match_participants` quản lý từng slot Solo Lobby, `+1 Guest`, `WAITLISTED`, `CHECKED_IN`, `NO_SHOW`. |
| [UserSportRating.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Models/UserSportRating.cs) | Thêm mới | Entity ánh xạ `dbo.user_sport_ratings` lưu Elo và thành tích thắng/hòa/thua riêng theo môn thể thao. |
| [SportHubDbContext.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Data/SportHubDbContext.cs) | Sửa | Đăng ký 4 `DbSet` mới, cấu hình precision tọa độ/deposit, index và quan hệ khóa ngoại (`FK_matches_booking` dùng `DeleteBehavior.NoAction`). |
| [DbInitializer.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Data/DbInitializer.cs) | Sửa | Thêm `EnsureRealWorldSchemaUpgradesAsync` tự động nâng cấp schema idempotent khi khởi chạy Development trên DB cũ và seed 2 sân mẫu `COMMUNITY_UNCLAIMED`. |
| [BookingMatchLifecycleService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/BookingMatchLifecycleService.cs) | Thêm mới | `BackgroundService` chạy mỗi 60s để dọn `HOLD` hết hạn, đóng booking quá giờ, và auto-confirm tỉ số Match quá hạn 24h. |
| [Program.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Program.cs) | Sửa | Đăng ký `AddHostedService<BookingMatchLifecycleService>()`. |

### C. Backend — DTOs, Repositories, Services & Controllers
| File | Trạng thái | Nội dung thay đổi / thêm mới |
|---|---|---|
| [AuthDtos.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/DTOs/AuthDtos.cs) | Sửa | Trả thêm `ReliabilityScore` trong `UserProfileResponseDto`. |
| [FieldDto.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/DTOs/FieldDto.cs) | Sửa | Bổ sung các trường xác thực/tọa độ vào `FieldDto`, `FieldCreateDto`, `FieldUpdateDto`; thêm `FieldVerifyDto`, `CommunityFieldSuggestDto`, `FieldClaim*Dto`, `FieldReport*Dto`. |
| [BookingCreateDto.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/DTOs/BookingCreateDto.cs) | Sửa | Thêm `ExpectedPlayers` và chi tiết policy/type vào `BookingResponseDto`; thêm `WalkInBookingCreateDto`, `RainOutDto`. |
| [MatchCreateDto.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/DTOs/MatchCreateDto.cs) | Sửa | Bổ sung `MatchMode`, `MaxSlots`, `PreReservedSlots`, `BookingId`, `IsRanked`, `MatchJoinDto`, `MatchScoreDisputeDto`, `MatchScoreResolveDto`, `MatchParticipantDto`, và cập nhật `MatchResponseDto`/`LeaderboardEntryDto`. |
| [FieldRepository.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Repositories/FieldRepository.cs) | Sửa | Lọc các truy vấn công khai chỉ trả về sân có `VerificationStatus` là `APPROVED` hoặc `UNCLAIMED`; bỏ qua booking `EXPIRED`/`RAIN_OUT` khi tìm sân trống. |
| [BookingRepository.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Repositories/BookingRepository.cs) | Sửa | Không tính `EXPIRED` và `RAIN_OUT` là xung đột lịch; sửa `CompleteElapsedBookingsAsync` tách `CONFIRMED -> COMPLETED` và `PENDING -> EXPIRED`. |
| [MatchRepository.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Repositories/MatchRepository.cs) | Sửa | Include thêm `Participants` (và `Participant.User`) khi tải danh sách và chi tiết Match. |
| [NotificationService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/NotificationService.cs) | Sửa | Thêm `NotifyAdminsAsync` và `NotifyBookingMatchParticipantsAsync`. |
| [IFieldService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/IFieldService.cs) & [FieldService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/FieldService.cs) | Sửa | Xử lý duyệt sân nội bộ (`PENDING_REVIEW -> APPROVED/REJECTED/SUSPENDED`), kiểm tra trùng tọa độ Haversine `<= 50m`, upload hồ sơ xác thực vào `wwwroot/uploads/verifications/`, đề xuất sân cộng đồng, Claim ownership (kèm thăng role `OWNER`), và Report sân sai phạm. |
| [IBookingService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/IBookingService.cs) & [BookingService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/BookingService.cs) | Sửa | Chặn đặt lịch trên sân chưa duyệt hoặc `COMMUNITY_UNCLAIMED`; kiểm tra `ExpectedPlayers <= Capacity`; áp dụng chính sách trừ điểm uy tín khi hủy sát giờ; thông báo sang Match liên kết; bổ sung `CheckInBookingAsync`. |
| [FieldOwnerBookingService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/FieldOwnerBookingService.cs) | Sửa | Thêm `CreateWalkInAsync` (khóa lịch khách vãng lai chống đụng lịch online) và `RainOutAsync` (hoãn thời tiết sân ngoài trời); đồng bộ cảnh báo Match khi từ chối booking. |
| [IAdminService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/IAdminService.cs) & [AdminService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/AdminService.cs) | Sửa | Thêm `RainOutBookingAsync` và cảnh báo Match liên kết khi Admin từ chối booking. |
| [IMatchService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/IMatchService.cs) & [MatchService.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Services/MatchService.cs) | Sửa | Triển khai 3 chế độ trận (`TEAM_CHALLENGE`, `CUSTOM_PRIVATE`, `SOLO_LOBBY`), Waitlist & Auto-promote, Anti-hoarding, Check-in & No-show, Dual-Confirmation Score + Dispute/Resolve + Upload bằng chứng, Elo theo môn (`user_sport_ratings`) & Anti-win-trading. |
| [FieldController.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Controllers/FieldController.cs) | Sửa | Ẩn sân chưa duyệt với khách ở `GET /api/fields`; thêm `GET /api/fields/manage`, `POST /api/fields/{id}/verification-doc`, `POST /api/fields/community-suggest`, `POST /api/fields/claim-evidence`, `POST /api/fields/{id}/claim`, `POST /api/fields/{id}/report`. |
| [BookingController.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Controllers/BookingController.cs) | Sửa | Thêm `PATCH /api/bookings/{bookingId}/check-in`. |
| [FieldOwnerBookingsController.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Controllers/FieldOwnerBookingsController.cs) | Sửa | Thêm `POST /api/owner/bookings/walk-in` và `PATCH /api/owner/bookings/{bookingId}/rain-out`. |
| [AdminController.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Controllers/AdminController.cs) | Sửa | Thêm `PATCH /api/admin/bookings/{bookingId}/rain-out`, `PATCH /api/admin/fields/{fieldId}/verify`, `GET /api/admin/field-claims`, `PATCH /api/admin/field-claims/{claimId}/review`, `GET /api/admin/field-reports`, `PATCH /api/admin/field-reports/{reportId}/resolve`. |
| [MatchController.cs](file:///d:/My%20Application/SportHub/Backend/SportHub.API/Controllers/MatchController.cs) | Sửa | Thêm `POST /api/matches/{id}/leave`, `check-in`, `no-show/{targetUserId}`, `score/propose`, `score/confirm`, `score/dispute`, `dispute-evidence`, `PATCH score/resolve`; hỗ trợ `sportType` trên `GET /api/matches/leaderboard`. |

### D. Frontend (HTML & JavaScript)
| File | Trạng thái | Nội dung thay đổi / thêm mới |
|---|---|---|
| [shared.js](file:///d:/My%20Application/SportHub/Frontend/js/shared.js) | Sửa | Bổ sung badge `EXPIRED`, `RAIN_OUT`, `reliabilityScore`, `getFieldTrustBadge`, `getMatchModeLabel`. |
| [index.html](file:///d:/My%20Application/SportHub/Frontend/index.html) & [main.js](file:///d:/My%20Application/SportHub/Frontend/js/main.js) | Sửa | Hiển thị huy hiệu xác thực / sân cộng đồng trên card sân; thêm input số người dự kiến khi đặt sân; thay form đặt lịch bằng panel *"Hẹn kèo / Claim chủ sân"* đối với sân `COMMUNITY_UNCLAIMED`; thêm 3 modal **Đề xuất sân cộng đồng**, **Xác minh quyền chủ sân (Claim)** và **Báo cáo sân**. |
| [my-bookings.html](file:///d:/My%20Application/SportHub/Frontend/my-bookings.html) & [my-bookings.js](file:///d:/My%20Application/SportHub/Frontend/js/my-bookings.js) | Sửa | Hiển thị điểm uy tín (`Uy tín: X/100`), nút **Check-in sân**, nút **Tạo kèo** từ booking (`matches.html?bookingId=...`), và chi tiết chính sách hủy/`RAIN_OUT`/`EXPIRED`. |
| [matches.html](file:///d:/My%20Application/SportHub/Frontend/matches.html) & [matches.js](file:///d:/My%20Application/SportHub/Frontend/js/matches.js) | Sửa | Form tạo kèo hỗ trợ 3 chế độ (`TEAM_CHALLENGE`, `SOLO_LOBBY`, `CUSTOM_PRIVATE`), gắn `bookingId`, tự khóa `Tính Elo` nếu sân chưa xác thực; giao diện danh sách slot/check-in/no-show/waitlist; modal đăng ký slot Solo (`teamSide` & `+1 Guest`), đề xuất/xác nhận/khiếu nại (kèm upload ảnh)/phân xử tỉ số; bộ lọc bảng xếp hạng Elo theo môn. |
| [admin.html](file:///d:/My%20Application/SportHub/Frontend/admin.html) & [admin.js](file:///d:/My%20Application/SportHub/Frontend/js/admin.js) | Sửa | Tải sân qua `/fields/manage`; bổ sung tọa độ, link map, sân trong nhà, upload ảnh hồ sơ xác thực nội bộ vào drawer sân; Admin duyệt/từ chối trực tiếp trên bảng sân; Owner tạo lịch vãng lai (`Walk-in`) và bấm **Hoãn mưa (`RAIN_OUT`)**; tab mới **Kiểm duyệt & khiếu nại** để Admin xử lý Claim và Report sân. |

---

## 3. Kết Quả Kiểm Chứng Thực Tế

1. **Build Backend (`dotnet build Backend/SportHub.API/SportHub.API.csproj --no-restore`):**
   - Thành công (`0 Warning(s)`, `0 Error(s)`).
2. **Kiểm tra cú pháp Frontend JS (`node --check Frontend/js/*.js`):**
   - Toàn bộ 10/10 file JS (`admin.js`, `community.js`, `config.js`, `home-ui.js`, `main.js`, `matches.js`, `my-bookings.js`, `notifications.js`, `profile.js`, `shared.js`) đều pass không lỗi cú pháp.
3. **Kiểm thử End-to-End API trên SQL Server LocalDB (`(localdb)\MSSQLLocalDB / SportHubDb`):**
   - Đã chạy kịch bản kiểm thử tự động xác minh thành công toàn bộ **19/19 assertions**:
     - Khởi tạo/nâng cấp schema trên LocalDB hiện có + seed sân cộng đồng.
     - Owner tạo sân -> `PENDING_REVIEW` (`isAvailable = false`) -> chặn đặt lịch -> chặn tạo trùng trong bán kính 50m -> upload file chứng minh nội bộ -> Admin duyệt `APPROVED`.
     - Customer đề xuất sân cộng đồng -> Admin duyệt `UNCLAIMED` -> chặn đặt online -> User nộp Claim -> Admin duyệt Claim chuyển quyền sở hữu & thăng role `OWNER` (token cũ bị vô hiệu hóa đúng bảo mật).
     - Báo cáo sân sai phạm & Admin xử lý.
     - Owner khóa lịch `WALK_IN` -> chặn khách đặt online trùng giờ; đặt lịch online kèm `expectedPlayers` -> xác nhận -> Check-in booking; xử lý hoãn mưa `RAIN_OUT`.
     - Tạo kèo `CUSTOM_PRIVATE` (1 Host, Unranked); tạo `SOLO_LOBBY` gắn `bookingId` -> nhận slot -> full vào `WAITLISTED` -> người rời kèo tự động đôn `WAITLISTED` lên `JOINED`.
     - Dual-Confirmation Scoring: đề xuất tỉ số (`PENDING_CONFIRMATION`) -> chặn người gửi tự xác nhận -> đối thủ xác nhận (`CONFIRMED`) -> cập nhật bảng xếp hạng Elo riêng môn `FOOTBALL`; luồng khiếu nại (`DISPUTED`) -> Chủ sân đã xác thực phân xử `VOIDED`.
