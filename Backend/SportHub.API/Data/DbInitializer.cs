using Microsoft.EntityFrameworkCore;
using SportHub.API.Models;
using SportHub.API.Services;

namespace SportHub.API.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider services, IConfiguration configuration, ILogger logger)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<SportHubDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var connection = dbContext.Database.GetDbConnection();
        logger.LogInformation("SportHub database target: {DataSource} / {Database}", connection.DataSource, connection.Database);

        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
        if (pendingMigrations.Any())
        {
            await dbContext.Database.MigrateAsync();
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync();
        }

        await EnsureRealWorldSchemaUpgradesAsync(dbContext, logger);

        // EnsureCreated only creates schema for a brand-new database. Existing databases
        // are upgraded with the versioned SQL migration run separately by a DB owner.

        var shouldSeed = configuration.GetValue<bool>("SeedSampleData");
        if (!shouldSeed)
        {
            return;
        }

        var demoAdminEmail = string.IsNullOrWhiteSpace(configuration["DemoAdmin:Email"])
            ? "admin@sporthub.com"
            : configuration["DemoAdmin:Email"]!.Trim().ToLowerInvariant();
        var demoAdminPassword = string.IsNullOrWhiteSpace(configuration["DemoAdmin:Password"])
            ? "Admin@123"
            : configuration["DemoAdmin:Password"]!;

        var existingAdmin = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == demoAdminEmail);
        if (existingAdmin is null)
        {
            dbContext.Users.Add(new User
            {
                Email = demoAdminEmail,
                Password = passwordHasher.HashPassword(demoAdminPassword),
                FullName = "Admin SportHub",
                Phone = "0900000000",
                Address = "Thủ Dầu Một, Bình Dương",
                Role = UserRole.ADMIN.ToString(),
                IsActive = true
            });
            await dbContext.SaveChangesAsync();
            logger.LogInformation("Seeded initial development admin account ({Email}).", demoAdminEmail);
        }
        else
        {
            var updated = false;
            if (existingAdmin.Role != UserRole.ADMIN.ToString())
            {
                existingAdmin.Role = UserRole.ADMIN.ToString();
                updated = true;
            }
            if (!existingAdmin.IsActive)
            {
                existingAdmin.IsActive = true;
                updated = true;
            }
            if (!passwordHasher.Verify(demoAdminPassword, existingAdmin.Password))
            {
                existingAdmin.Password = passwordHasher.HashPassword(demoAdminPassword);
                updated = true;
            }
            if (updated)
            {
                existingAdmin.UpdatedAt = DateTime.Now;
                await dbContext.SaveChangesAsync();
                logger.LogInformation("Synchronized development admin account ({Email}).", demoAdminEmail);
            }
        }

        if (!await dbContext.Fields.AnyAsync())
        {
            var sampleFields = new List<Field>
            {
                new()
                {
                    Name = "Sân Bóng Đá 5v5 Thủ Dầu Một",
                    Description = "Sân bóng đá nhân tạo chất lượng cao, trang thiết bị đầy đủ, thích hợp cho các trận đấu và tập luyện",
                    Location = "123 Đường Trường Chinh, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Bong+Da+1",
                    PricePerHour = 150000m,
                    Capacity = 10,
                    SportType = "FOOTBALL",
                    Amenities = "Đèn LED, Bãi giữ xe, Nước uống",
                    IsAvailable = true
                },
                new()
                {
                    Name = "Sân Bóng Chuyền Thủ Dầu Một",
                    Description = "Sân bóng chuyền tiêu chuẩn, mặt phẳng, ánh sáng tốt, phù hợp tập luyện và thi đấu",
                    Location = "456 Đường Nguyễn Hữu Cảnh, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Bong+Chuyen",
                    PricePerHour = 100000m,
                    Capacity = 12,
                    SportType = "VOLLEYBALL",
                    Amenities = "Đèn chiếu sáng, Bãi giữ xe",
                    IsAvailable = true
                },
                new()
                {
                    Name = "Sân Cầu Lông Thủ Dầu Một",
                    Description = "Sân cầu lông phủ thảm chất lượng, điều hòa lạnh, an toàn cho vận động viên",
                    Location = "789 Đường Huỳnh Văn Lũy, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Cau+Long",
                    PricePerHour = 80000m,
                    Capacity = 8,
                    SportType = "BADMINTON",
                    Amenities = "Điều hòa, Thảm PVC, Phòng thay đồ",
                    IsAvailable = true
                },
                new()
                {
                    Name = "Sân Bóng Rổ Thủ Dầu Một",
                    Description = "Sân bóng rổ tiêu chuẩn quốc tế, mặt sân sinh thái, ánh sáng LED hiện đại",
                    Location = "999 Đường Lê Lợi, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Bong+Ro",
                    PricePerHour = 120000m,
                    Capacity = 15,
                    SportType = "BASKETBALL",
                    Amenities = "Đèn LED, Khán đài mini",
                    IsAvailable = true
                },
                new()
                {
                    Name = "Sân Bóng Đá 7v7 Premium",
                    Description = "Sân bóng đá cỏ nhân tạo cao cấp, có hệ thống đèn LED, tập luyện chuyên nghiệp",
                    Location = "111 Đường Mỹ Phước, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Bong+Da+Premium",
                    PricePerHour = 200000m,
                    Capacity = 14,
                    SportType = "FOOTBALL",
                    Amenities = "Cỏ FIFA, Đèn LED, Phòng tắm, Căng tin",
                    IsAvailable = true
                },
                new()
                {
                    Name = "Sân Tennis Thủ Dầu Một",
                    Description = "Sân tennis tiêu chuẩn quốc tế, bề mặt hard court, trang thiết bị chuyên nghiệp",
                    Location = "222 Đường Mỹ Phước, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Tennis",
                    PricePerHour = 180000m,
                    Capacity = 4,
                    SportType = "TENNIS",
                    Amenities = "Hard court, Đèn LED, Khu nghỉ",
                    IsAvailable = true
                },
                new()
                {
                    Name = "Sân Cầu Lông Đôi",
                    Description = "Sân cầu lông 2 court liền kề, điều hòa toàn bộ, phù hợp tập luyện đôi",
                    Location = "333 Đường Tân Uyên, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Cau+Long+Doi",
                    PricePerHour = 75000m,
                    Capacity = 10,
                    SportType = "BADMINTON",
                    Amenities = "Điều hòa, 2 sân đôi, Bãi giữ xe",
                    IsAvailable = true
                },
                new()
                {
                    Name = "Sân Bóng Chuyền Pro",
                    Description = "Sân bóng chuyền chuyên nghiệp, mặt sân chuẩn thi đấu, sân phụ khởi động",
                    Location = "444 Đường 30 Tháng 4, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Bong+Chuyen+Pro",
                    PricePerHour = 130000m,
                    Capacity = 14,
                    SportType = "VOLLEYBALL",
                    Amenities = "Đèn LED, Lưới chuẩn thi đấu",
                    IsAvailable = true
                },
                new()
                {
                    Name = "Sân Bóng Rổ 3v3",
                    Description = "Sân bóng rổ nhỏ gọn, phù hợp cho tập luyện 3v3, ánh sáng tốt",
                    Location = "555 Đường Lý Tự Trọng, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Bong+Ro+3v3",
                    PricePerHour = 90000m,
                    Capacity = 8,
                    SportType = "BASKETBALL",
                    Amenities = "Đèn chiếu sáng",
                    IsAvailable = false
                },
                new()
                {
                    Name = "Sân Bóng Đá Futsal",
                    Description = "Sân futsal tiêu chuẩn, bề mặt bán cứng trong nhà, ánh sáng chuẩn",
                    Location = "666 Đường Quốc Lộ 1, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Futsal",
                    PricePerHour = 160000m,
                    Capacity = 12,
                    SportType = "FOOTBALL",
                    Amenities = "Trong nhà, Đèn LED, Phòng thay đồ",
                    IsAvailable = true
                },
                new()
                {
                    Name = "Sân Tennis Indoor",
                    Description = "Sân tennis trong nhà, có mái che và điều hòa, không lo thời tiết",
                    Location = "777 Đường Quốc Lộ 13, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Tennis+Indoor",
                    PricePerHour = 200000m,
                    Capacity = 4,
                    SportType = "TENNIS",
                    Amenities = "Trong nhà, Điều hòa, Phòng tắm",
                    IsAvailable = true
                },
                new()
                {
                    Name = "Sân Bóng Chuyền Cát",
                    Description = "Sân bóng chuyền cát tự nhiên, lý tưởng cho giải đấu cộng đồng",
                    Location = "888 Đường Tân Uyên, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    ImageUrl = "https://via.placeholder.com/400x300?text=San+Bong+Chuyen+Cat",
                    PricePerHour = 70000m,
                    Capacity = 12,
                    SportType = "VOLLEYBALL",
                    Amenities = "Cát tự nhiên, Vòi tắm tráng",
                    IsAvailable = true
                }
            };

            dbContext.Fields.AddRange(sampleFields);
            await dbContext.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} sample sports fields.", sampleFields.Count);
        }

        if (!await dbContext.Fields.AnyAsync(f => f.VenueSource == "COMMUNITY_UNCLAIMED"))
        {
            var communityFields = new List<Field>
            {
                new()
                {
                    Name = "Sân Bóng Rổ Công Viên Thành Phố Mới",
                    Description = "Sân công cộng miễn phí do cộng đồng đóng góp, phù hợp hẹn kèo giao lưu cuối tuần (chưa mở đặt lịch online).",
                    Location = "Công viên Trung tâm Thành phố Mới, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    PricePerHour = 1m,
                    Capacity = 10,
                    SportType = "BASKETBALL",
                    Amenities = "Ngoài trời, Công cộng, Đèn công viên",
                    IsAvailable = true,
                    VenueSource = "COMMUNITY_UNCLAIMED",
                    VerificationStatus = "UNCLAIMED",
                    Latitude = 11.057420m,
                    Longitude = 106.683410m,
                    MapUrl = "https://maps.google.com/?q=11.057420,106.683410"
                },
                new()
                {
                    Name = "Sân Cầu Lông Khu Dân Cư Chánh Nghĩa",
                    Description = "Cụm sân phong trào khu Chánh Nghĩa (chủ sân chưa liên kết SportHub — tự liên hệ sân hoặc chủ sân có thể xác minh sở hữu).",
                    Location = "Đường D11, KDC Chánh Nghĩa, Thủ Dầu Một",
                    City = "Thủ Dầu Một",
                    Province = "Bình Dương",
                    PricePerHour = 65000m,
                    Capacity = 8,
                    SportType = "BADMINTON",
                    Amenities = "Trong nhà, Thảm PVC",
                    IsAvailable = true,
                    IsIndoor = true,
                    VenueSource = "COMMUNITY_UNCLAIMED",
                    VerificationStatus = "UNCLAIMED",
                    Latitude = 10.974850m,
                    Longitude = 106.654210m,
                    MapUrl = "https://maps.google.com/?q=10.974850,106.654210"
                }
            };
            dbContext.Fields.AddRange(communityFields);
            await dbContext.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} community unclaimed venues.", communityFields.Count);
        }
    }

    private static async Task EnsureRealWorldSchemaUpgradesAsync(SportHubDbContext dbContext, ILogger logger)
    {
        var statements = new[]
        {
            @"IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'bio') IS NULL
                ALTER TABLE dbo.users ADD bio NVARCHAR(500) NULL;",
            @"IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'avatar_url') IS NULL
                ALTER TABLE dbo.users ADD avatar_url NVARCHAR(500) NULL;",
            @"IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'google_sub') IS NULL
                ALTER TABLE dbo.users ADD google_sub NVARCHAR(255) NULL;",
            @"IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'google_sub') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'ux_users_google_sub' AND object_id = OBJECT_ID(N'dbo.users'))
                CREATE UNIQUE INDEX ux_users_google_sub ON dbo.users(google_sub) WHERE google_sub IS NOT NULL;",
            @"IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.bookings', N'cancellation_reason') IS NULL
                ALTER TABLE dbo.bookings ADD cancellation_reason NVARCHAR(300) NULL;",
            @"IF OBJECT_ID(N'dbo.notifications', N'U') IS NULL AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
                CREATE TABLE dbo.notifications (
                    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_notifications PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    booking_id BIGINT NULL,
                    category NVARCHAR(30) NOT NULL CONSTRAINT DF_notifications_category DEFAULT N'BOOKING',
                    reference_id BIGINT NULL,
                    message NVARCHAR(500) NOT NULL,
                    is_read BIT NOT NULL CONSTRAINT DF_notifications_is_read DEFAULT 0,
                    created_at DATETIME2 NOT NULL CONSTRAINT DF_notifications_created_at DEFAULT GETDATE(),
                    CONSTRAINT FK_notifications_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
                );",
            @"IF OBJECT_ID(N'dbo.notifications', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.notifications', N'category') IS NULL
                ALTER TABLE dbo.notifications ADD category NVARCHAR(30) NOT NULL CONSTRAINT DF_notifications_category DEFAULT N'BOOKING';",
            @"IF OBJECT_ID(N'dbo.notifications', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.notifications', N'reference_id') IS NULL
                ALTER TABLE dbo.notifications ADD reference_id BIGINT NULL;",
            @"IF OBJECT_ID(N'dbo.friend_requests', N'U') IS NULL AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
                CREATE TABLE dbo.friend_requests (
                    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_friend_requests PRIMARY KEY,
                    from_user_id BIGINT NOT NULL,
                    to_user_id BIGINT NOT NULL,
                    status NVARCHAR(20) NOT NULL CONSTRAINT DF_friend_requests_status DEFAULT N'PENDING',
                    created_at DATETIME2 NOT NULL CONSTRAINT DF_friend_requests_created_at DEFAULT GETDATE(),
                    updated_at DATETIME2 NOT NULL CONSTRAINT DF_friend_requests_updated_at DEFAULT GETDATE(),
                    CONSTRAINT FK_friend_requests_from FOREIGN KEY (from_user_id) REFERENCES dbo.users(id),
                    CONSTRAINT FK_friend_requests_to FOREIGN KEY (to_user_id) REFERENCES dbo.users(id)
                );",
            @"IF OBJECT_ID(N'dbo.conversations', N'U') IS NULL AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
              BEGIN
                CREATE TABLE dbo.conversations (
                    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_conversations PRIMARY KEY,
                    participant_one_id BIGINT NOT NULL,
                    participant_two_id BIGINT NOT NULL,
                    created_at DATETIME2 NOT NULL CONSTRAINT DF_conversations_created_at DEFAULT GETDATE(),
                    CONSTRAINT FK_conversations_one FOREIGN KEY (participant_one_id) REFERENCES dbo.users(id),
                    CONSTRAINT FK_conversations_two FOREIGN KEY (participant_two_id) REFERENCES dbo.users(id)
                );
                CREATE UNIQUE INDEX UX_conversations_participants ON dbo.conversations(participant_one_id, participant_two_id);
              END;",
            @"IF OBJECT_ID(N'dbo.chat_messages', N'U') IS NULL AND OBJECT_ID(N'dbo.conversations', N'U') IS NOT NULL
                CREATE TABLE dbo.chat_messages (
                    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_chat_messages PRIMARY KEY,
                    conversation_id BIGINT NOT NULL,
                    sender_user_id BIGINT NOT NULL,
                    content NVARCHAR(2000) NOT NULL,
                    created_at DATETIME2 NOT NULL CONSTRAINT DF_chat_messages_created_at DEFAULT GETDATE(),
                    CONSTRAINT FK_chat_messages_conversation FOREIGN KEY (conversation_id) REFERENCES dbo.conversations(id) ON DELETE CASCADE,
                    CONSTRAINT FK_chat_messages_sender FOREIGN KEY (sender_user_id) REFERENCES dbo.users(id)
                );",
            @"IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'reliability_score') IS NULL
                ALTER TABLE dbo.users ADD reliability_score INT NOT NULL CONSTRAINT DF_users_reliability_score DEFAULT 100;",
            @"IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.fields', N'venue_source') IS NULL
                ALTER TABLE dbo.fields ADD venue_source NVARCHAR(30) NOT NULL CONSTRAINT DF_fields_venue_source DEFAULT N'PARTNER';",
            @"IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.fields', N'verification_status') IS NULL
                ALTER TABLE dbo.fields ADD verification_status NVARCHAR(30) NOT NULL CONSTRAINT DF_fields_verification_status DEFAULT N'APPROVED';",
            @"IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.fields', N'latitude') IS NULL
                ALTER TABLE dbo.fields ADD latitude DECIMAL(9,6) NULL;",
            @"IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.fields', N'longitude') IS NULL
                ALTER TABLE dbo.fields ADD longitude DECIMAL(9,6) NULL;",
            @"IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.fields', N'map_url') IS NULL
                ALTER TABLE dbo.fields ADD map_url NVARCHAR(500) NULL;",
            @"IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.fields', N'verification_doc_url') IS NULL
                ALTER TABLE dbo.fields ADD verification_doc_url NVARCHAR(500) NULL;",
            @"IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.fields', N'verification_notes') IS NULL
                ALTER TABLE dbo.fields ADD verification_notes NVARCHAR(500) NULL;",
            @"IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.fields', N'verified_at') IS NULL
                ALTER TABLE dbo.fields ADD verified_at DATETIME2 NULL;",
            @"IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.fields', N'verified_by_admin_id') IS NULL
                ALTER TABLE dbo.fields ADD verified_by_admin_id BIGINT NULL;",
            @"IF OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.fields', N'is_indoor') IS NULL
                ALTER TABLE dbo.fields ADD is_indoor BIT NOT NULL CONSTRAINT DF_fields_is_indoor DEFAULT 0;",
            @"IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.bookings', N'booking_type') IS NULL
                ALTER TABLE dbo.bookings ADD booking_type NVARCHAR(20) NOT NULL CONSTRAINT DF_bookings_type DEFAULT N'ONLINE';",
            @"IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.bookings', N'expected_players') IS NULL
                ALTER TABLE dbo.bookings ADD expected_players INT NULL;",
            @"IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.bookings', N'deposit_amount') IS NULL
                ALTER TABLE dbo.bookings ADD deposit_amount DECIMAL(10,2) NOT NULL CONSTRAINT DF_bookings_deposit DEFAULT 0;",
            @"IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.bookings', N'payment_status') IS NULL
                ALTER TABLE dbo.bookings ADD payment_status NVARCHAR(20) NOT NULL CONSTRAINT DF_bookings_payment_status DEFAULT N'UNPAID';",
            @"IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.bookings', N'cancellation_policy_applied') IS NULL
                ALTER TABLE dbo.bookings ADD cancellation_policy_applied NVARCHAR(120) NULL;",
            @"IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.bookings', N'checked_in_at') IS NULL
                ALTER TABLE dbo.bookings ADD checked_in_at DATETIME2 NULL;",
            @"IF OBJECT_ID(N'dbo.bookings', N'U') IS NOT NULL
              BEGIN
                IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_bookings_status' AND parent_object_id = OBJECT_ID(N'dbo.bookings'))
                    ALTER TABLE dbo.bookings DROP CONSTRAINT CK_bookings_status;
                ALTER TABLE dbo.bookings ADD CONSTRAINT CK_bookings_status CHECK (status IN (N'PENDING', N'HOLD', N'CONFIRMED', N'COMPLETED', N'CANCELLED', N'EXPIRED', N'RAIN_OUT'));
              END;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL
              BEGIN
                IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_matches_missing_players' AND parent_object_id = OBJECT_ID(N'dbo.matches'))
                    ALTER TABLE dbo.matches DROP CONSTRAINT CK_matches_missing_players;
                ALTER TABLE dbo.matches ADD CONSTRAINT CK_matches_missing_players CHECK (missing_players BETWEEN 0 AND 50);
              END;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'match_mode') IS NULL
                ALTER TABLE dbo.matches ADD match_mode NVARCHAR(20) NOT NULL CONSTRAINT DF_matches_mode DEFAULT N'TEAM_CHALLENGE';",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'max_slots') IS NULL
                ALTER TABLE dbo.matches ADD max_slots INT NOT NULL CONSTRAINT DF_matches_max_slots DEFAULT 2;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'pre_reserved_slots') IS NULL
                ALTER TABLE dbo.matches ADD pre_reserved_slots INT NOT NULL CONSTRAINT DF_matches_pre_reserved DEFAULT 1;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'booking_id') IS NULL
                ALTER TABLE dbo.matches ADD booking_id BIGINT NULL;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'is_ranked') IS NULL
                ALTER TABLE dbo.matches ADD is_ranked BIT NOT NULL CONSTRAINT DF_matches_is_ranked DEFAULT 1;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'score_status') IS NULL
                ALTER TABLE dbo.matches ADD score_status NVARCHAR(30) NOT NULL CONSTRAINT DF_matches_score_status DEFAULT N'NONE';",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'proposed_host_score') IS NULL
                ALTER TABLE dbo.matches ADD proposed_host_score INT NULL;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'proposed_challenger_score') IS NULL
                ALTER TABLE dbo.matches ADD proposed_challenger_score INT NULL;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'score_submitted_by_user_id') IS NULL
                ALTER TABLE dbo.matches ADD score_submitted_by_user_id BIGINT NULL;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'score_submitted_at') IS NULL
                ALTER TABLE dbo.matches ADD score_submitted_at DATETIME2 NULL;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'score_confirm_deadline') IS NULL
                ALTER TABLE dbo.matches ADD score_confirm_deadline DATETIME2 NULL;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'disputed_host_score') IS NULL
                ALTER TABLE dbo.matches ADD disputed_host_score INT NULL;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'disputed_challenger_score') IS NULL
                ALTER TABLE dbo.matches ADD disputed_challenger_score INT NULL;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'dispute_reason') IS NULL
                ALTER TABLE dbo.matches ADD dispute_reason NVARCHAR(500) NULL;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.matches', N'dispute_evidence_url') IS NULL
                ALTER TABLE dbo.matches ADD dispute_evidence_url NVARCHAR(500) NULL;",
            @"IF OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_matches_booking')
                ALTER TABLE dbo.matches ADD CONSTRAINT FK_matches_booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(id) ON DELETE NO ACTION;",
            @"IF OBJECT_ID(N'dbo.field_claim_requests', N'U') IS NULL AND OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL
                CREATE TABLE dbo.field_claim_requests (
                    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_field_claim_requests PRIMARY KEY,
                    field_id BIGINT NOT NULL,
                    claimant_user_id BIGINT NOT NULL,
                    evidence_doc_url NVARCHAR(500) NULL,
                    map_url NVARCHAR(500) NULL,
                    notes NVARCHAR(500) NULL,
                    status NVARCHAR(20) NOT NULL CONSTRAINT DF_field_claims_status DEFAULT N'PENDING',
                    admin_note NVARCHAR(500) NULL,
                    reviewed_by_admin_id BIGINT NULL,
                    created_at DATETIME2 NOT NULL CONSTRAINT DF_field_claims_created DEFAULT GETDATE(),
                    reviewed_at DATETIME2 NULL,
                    CONSTRAINT FK_field_claims_field FOREIGN KEY (field_id) REFERENCES dbo.fields(id) ON DELETE CASCADE,
                    CONSTRAINT FK_field_claims_user FOREIGN KEY (claimant_user_id) REFERENCES dbo.users(id)
                );",
            @"IF OBJECT_ID(N'dbo.field_reports', N'U') IS NULL AND OBJECT_ID(N'dbo.fields', N'U') IS NOT NULL
                CREATE TABLE dbo.field_reports (
                    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_field_reports PRIMARY KEY,
                    field_id BIGINT NOT NULL,
                    reporter_user_id BIGINT NOT NULL,
                    reason NVARCHAR(100) NOT NULL,
                    details NVARCHAR(500) NULL,
                    status NVARCHAR(20) NOT NULL CONSTRAINT DF_field_reports_status DEFAULT N'OPEN',
                    created_at DATETIME2 NOT NULL CONSTRAINT DF_field_reports_created DEFAULT GETDATE(),
                    CONSTRAINT FK_field_reports_field FOREIGN KEY (field_id) REFERENCES dbo.fields(id) ON DELETE CASCADE,
                    CONSTRAINT FK_field_reports_user FOREIGN KEY (reporter_user_id) REFERENCES dbo.users(id)
                );",
            @"IF OBJECT_ID(N'dbo.match_participants', N'U') IS NULL AND OBJECT_ID(N'dbo.matches', N'U') IS NOT NULL
                CREATE TABLE dbo.match_participants (
                    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_match_participants PRIMARY KEY,
                    match_id BIGINT NOT NULL,
                    user_id BIGINT NOT NULL,
                    team_side NVARCHAR(10) NOT NULL CONSTRAINT DF_match_participants_side DEFAULT N'ANY',
                    guest_count INT NOT NULL CONSTRAINT DF_match_participants_guest DEFAULT 0,
                    status NVARCHAR(20) NOT NULL CONSTRAINT DF_match_participants_status DEFAULT N'JOINED',
                    joined_at DATETIME2 NOT NULL CONSTRAINT DF_match_participants_joined DEFAULT GETDATE(),
                    checked_in_at DATETIME2 NULL,
                    CONSTRAINT FK_match_participants_match FOREIGN KEY (match_id) REFERENCES dbo.matches(id) ON DELETE CASCADE,
                    CONSTRAINT FK_match_participants_user FOREIGN KEY (user_id) REFERENCES dbo.users(id)
                );",
            @"IF OBJECT_ID(N'dbo.user_sport_ratings', N'U') IS NULL AND OBJECT_ID(N'dbo.users', N'U') IS NOT NULL
              BEGIN
                CREATE TABLE dbo.user_sport_ratings (
                    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_user_sport_ratings PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    sport_type NVARCHAR(50) NOT NULL,
                    elo_rating INT NOT NULL CONSTRAINT DF_user_sport_ratings_elo DEFAULT 1000,
                    matches_played INT NOT NULL CONSTRAINT DF_user_sport_ratings_played DEFAULT 0,
                    wins INT NOT NULL CONSTRAINT DF_user_sport_ratings_wins DEFAULT 0,
                    draws INT NOT NULL CONSTRAINT DF_user_sport_ratings_draws DEFAULT 0,
                    losses INT NOT NULL CONSTRAINT DF_user_sport_ratings_losses DEFAULT 0,
                    updated_at DATETIME2 NOT NULL CONSTRAINT DF_user_sport_ratings_updated DEFAULT GETDATE(),
                    CONSTRAINT FK_user_sport_ratings_user FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX UX_user_sport_ratings_user_sport ON dbo.user_sport_ratings(user_id, sport_type);
              END;"
        };

        foreach (var sql in statements)
        {
            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }
        logger.LogInformation("Verified real-world use-case schema upgrades.");
    }
}
