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

        var pendingMigrations = await dbContext.Database.GetPendingMigrationsAsync();
        if (pendingMigrations.Any())
        {
            await dbContext.Database.MigrateAsync();
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync();
        }

        // EnsureCreated does not alter tables in an existing database. Keep these
        // additive profile columns compatible with installations created earlier.
        await dbContext.Database.ExecuteSqlRawAsync("""
            IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'bio') IS NULL
                ALTER TABLE dbo.users ADD bio NVARCHAR(500) NULL;
            IF OBJECT_ID(N'dbo.users', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.users', N'avatar_url') IS NULL
                ALTER TABLE dbo.users ADD avatar_url NVARCHAR(500) NULL;
            """);

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
    }
}
