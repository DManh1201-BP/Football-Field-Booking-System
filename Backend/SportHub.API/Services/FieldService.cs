using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.DTOs;
using SportHub.API.Models;
using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class FieldService : IFieldService
{
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private static readonly HashSet<string> AllowedDocExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".pdf"
    };

    private const long MaxImageBytes = 5 * 1024 * 1024;
    private const long MaxDocBytes = 8 * 1024 * 1024;
    private const double DuplicateRadiusMeters = 50.0;

    private readonly SportHubDbContext _db;
    private readonly IFieldRepository _fieldRepository;
    private readonly IWebHostEnvironment _environment;
    private readonly NotificationService _notifications;

    public FieldService(
        SportHubDbContext db,
        IFieldRepository fieldRepository,
        IWebHostEnvironment environment,
        NotificationService notifications)
    {
        _db = db;
        _fieldRepository = fieldRepository;
        _environment = environment;
        _notifications = notifications;
    }

    public async Task<List<PublicFieldDto>> GetAllFieldsAsync(long? currentUserId = null, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var fields = await _fieldRepository.GetAllAsync(cancellationToken);
        if (isAdmin)
        {
            return fields.Select(PublicFieldDto.FromEntity).ToList();
        }

        return fields
            .Where(f => f.VerificationStatus is "APPROVED" or "UNCLAIMED" || (currentUserId.HasValue && f.OwnerId == currentUserId.Value))
            .Select(PublicFieldDto.FromEntity)
            .ToList();
    }

    public async Task<List<FieldDto>> GetManagedFieldsAsync(long? currentUserId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        if (isAdmin)
        {
            var all = await _fieldRepository.GetAllAsync(cancellationToken);
            return all.Select(FieldDto.FromEntity).ToList();
        }

        if (!currentUserId.HasValue)
        {
            return new List<FieldDto>();
        }

        var owned = await _fieldRepository.GetByOwnerIdAsync(currentUserId.Value, cancellationToken);
        return owned.Select(FieldDto.FromEntity).ToList();
    }

    public async Task<PublicFieldDto> GetFieldByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        return PublicFieldDto.FromEntity(field);
    }

    public async Task<FieldDto> GetManagedFieldByIdAsync(long id, long? currentUserId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        if (!isAdmin && (!currentUserId.HasValue || field.OwnerId != currentUserId.Value))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin quản lý của sân này.");
        }

        return FieldDto.FromEntity(field);
    }

    public async Task<List<PublicFieldDto>> GetAvailableFieldsAsync(CancellationToken cancellationToken = default)
    {
        var fields = await _fieldRepository.GetAvailableAsync(cancellationToken);
        return fields.Select(PublicFieldDto.FromEntity).ToList();
    }

    public async Task<List<PublicFieldDto>> GetFieldsByCityAsync(string city, CancellationToken cancellationToken = default)
    {
        var fields = await _fieldRepository.GetAvailableByCityAsync(city, cancellationToken);
        return fields.Select(PublicFieldDto.FromEntity).ToList();
    }

    public async Task<List<PublicFieldDto>> GetFieldsBySportTypeAsync(string sportType, CancellationToken cancellationToken = default)
    {
        var fields = await _fieldRepository.GetAvailableBySportTypeAsync(sportType, cancellationToken);
        return fields.Select(PublicFieldDto.FromEntity).ToList();
    }

    public async Task<List<PublicFieldDto>> SearchFieldsAsync(FieldSearchQueryDto query, CancellationToken cancellationToken = default)
    {
        if (query.StartTime.HasValue && query.EndTime.HasValue && query.EndTime.Value <= query.StartTime.Value)
        {
            throw new ArgumentException("End time must be after start time");
        }

        if (query.MinPrice.HasValue && query.MaxPrice.HasValue && query.MinPrice.Value > query.MaxPrice.Value)
        {
            throw new ArgumentException("Minimum price cannot exceed maximum price");
        }

        var fields = await _fieldRepository.SearchAvailableAsync(query, cancellationToken);
        return fields.Select(PublicFieldDto.FromEntity).ToList();
    }

    public async Task<FieldDto> CreateFieldAsync(FieldCreateDto dto, long? currentUserId = null, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        if (dto.OwnerId.HasValue && !isAdmin)
        {
            throw new UnauthorizedAccessException("Only admins can assign field ownership");
        }

        var normalizedSport = dto.SportType.Trim().ToUpperInvariant();
        await EnsureNoGeoDuplicateAsync(dto.Latitude, dto.Longitude, normalizedSport, excludeFieldId: null, cancellationToken);

        var venueSource = isAdmin && string.Equals(dto.VenueSource, "COMMUNITY_UNCLAIMED", StringComparison.OrdinalIgnoreCase)
            ? "COMMUNITY_UNCLAIMED"
            : "PARTNER";

        var verificationStatus = isAdmin
            ? (venueSource == "COMMUNITY_UNCLAIMED" ? "UNCLAIMED" : "APPROVED")
            : "PENDING_REVIEW";

        var field = new Field
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Location = dto.Location.Trim(),
            City = dto.City?.Trim(),
            Province = dto.Province?.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            PricePerHour = dto.PricePerHour ?? throw new ArgumentException("Price per hour is required"),
            Capacity = dto.Capacity,
            SportType = normalizedSport,
            Amenities = dto.Amenities?.Trim(),
            IsAvailable = isAdmin ? (dto.IsAvailable ?? true) : false,
            OwnerId = venueSource == "COMMUNITY_UNCLAIMED" ? null : (isAdmin ? dto.OwnerId ?? currentUserId : currentUserId),
            VenueSource = venueSource,
            VerificationStatus = verificationStatus,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            MapUrl = ResolveMapUrl(dto.MapUrl, dto.Latitude, dto.Longitude),
            VerifiedAt = isAdmin ? DateTime.Now : null,
            VerifiedByAdminId = isAdmin ? currentUserId : null,
            IsIndoor = dto.IsIndoor
        };

        var saved = await _fieldRepository.AddAsync(field, cancellationToken);
        if (!isAdmin)
        {
            await _notifications.NotifyAdminsAsync("VERIFICATION", saved.Id,
                $"Chủ sân vừa đăng ký sân mới \"{saved.Name}\" cần duyệt xác thực.", cancellationToken);
        }

        return FieldDto.FromEntity(saved);
    }

    public async Task<PublicFieldDto> SuggestCommunityFieldAsync(CommunityFieldSuggestDto dto, long currentUserId, CancellationToken cancellationToken = default)
    {
        var normalizedSport = dto.SportType.Trim().ToUpperInvariant();
        await EnsureNoGeoDuplicateAsync(dto.Latitude, dto.Longitude, normalizedSport, excludeFieldId: null, cancellationToken);

        var field = new Field
        {
            Name = dto.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(dto.Description)
                ? "Sân cộng đồng do người chơi đề xuất (chưa liên kết đặt lịch trực tuyến)."
                : dto.Description.Trim(),
            Location = dto.Location.Trim(),
            City = dto.City?.Trim(),
            Province = dto.Province?.Trim(),
            PricePerHour = 1m,
            Capacity = dto.Capacity,
            SportType = normalizedSport,
            IsAvailable = false,
            OwnerId = null,
            VenueSource = "COMMUNITY_UNCLAIMED",
            VerificationStatus = "PENDING_REVIEW",
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            MapUrl = ResolveMapUrl(dto.MapUrl, dto.Latitude, dto.Longitude),
            VerificationNotes = $"Đề xuất bởi user #{currentUserId}",
            IsIndoor = dto.IsIndoor
        };

        var saved = await _fieldRepository.AddAsync(field, cancellationToken);
        await _notifications.NotifyAdminsAsync("VERIFICATION", saved.Id,
            $"Người dùng #{currentUserId} vừa đề xuất sân cộng đồng \"{saved.Name}\" cần duyệt.", cancellationToken);

        return PublicFieldDto.FromEntity(saved);
    }

    public async Task<FieldDto> UpdateFieldAsync(long id, FieldUpdateDto dto, long? currentUserId = null, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        if (!isAdmin && (!currentUserId.HasValue || field.OwnerId != currentUserId.Value))
        {
            throw new UnauthorizedAccessException($"You do not have permission to update field {id}");
        }

        if (dto.OwnerId.HasValue && !isAdmin)
        {
            throw new UnauthorizedAccessException("Only admins can reassign field ownership");
        }

        var nextSport = dto.SportType is not null ? dto.SportType.Trim().ToUpperInvariant() : field.SportType;
        var nextLat = dto.Latitude ?? field.Latitude;
        var nextLng = dto.Longitude ?? field.Longitude;
        if (dto.Latitude.HasValue || dto.Longitude.HasValue || dto.SportType is not null)
        {
            await EnsureNoGeoDuplicateAsync(nextLat, nextLng, nextSport, excludeFieldId: id, cancellationToken);
        }

        if (dto.Name is not null) field.Name = dto.Name.Trim();
        if (dto.Description is not null) field.Description = dto.Description.Trim();
        if (dto.Location is not null) field.Location = dto.Location.Trim();
        if (dto.City is not null) field.City = dto.City.Trim();
        if (dto.Province is not null) field.Province = dto.Province.Trim();
        if (dto.ImageUrl is not null) field.ImageUrl = dto.ImageUrl.Trim();
        if (dto.PricePerHour.HasValue) field.PricePerHour = dto.PricePerHour.Value;
        if (dto.Capacity.HasValue) field.Capacity = dto.Capacity.Value;
        if (dto.SportType is not null) field.SportType = nextSport;
        if (dto.Amenities is not null) field.Amenities = dto.Amenities.Trim();
        if (dto.Latitude.HasValue) field.Latitude = dto.Latitude.Value;
        if (dto.Longitude.HasValue) field.Longitude = dto.Longitude.Value;
        if (dto.MapUrl is not null || dto.Latitude.HasValue || dto.Longitude.HasValue)
        {
            field.MapUrl = ResolveMapUrl(dto.MapUrl ?? field.MapUrl, field.Latitude, field.Longitude);
        }
        if (dto.IsIndoor.HasValue) field.IsIndoor = dto.IsIndoor.Value;

        if (dto.IsAvailable.HasValue)
        {
            if (!isAdmin && dto.IsAvailable.Value && field.VerificationStatus != "APPROVED")
            {
                throw new ArgumentException("Sân chưa được Admin duyệt xác thực nên chưa thể mở đặt công khai.");
            }
            field.IsAvailable = dto.IsAvailable.Value;
        }

        if (isAdmin && !string.IsNullOrWhiteSpace(dto.VenueSource))
        {
            field.VenueSource = dto.VenueSource.Trim().ToUpperInvariant();
        }
        if (isAdmin && dto.OwnerId.HasValue)
        {
            field.OwnerId = dto.OwnerId.Value;
            field.VenueSource = "PARTNER";
        }
        if (isAdmin && dto.ClearOwner)
        {
            field.OwnerId = null;
        }

        var updated = await _fieldRepository.UpdateAsync(field, cancellationToken);
        return FieldDto.FromEntity(updated);
    }

    public async Task DeleteFieldAsync(long id, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        await _fieldRepository.DeleteAsync(field, cancellationToken);
    }

    public async Task<FieldDto> UploadFieldImageAsync(long id, IFormFile file, long? currentUserId = null, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        if (!isAdmin && (!currentUserId.HasValue || field.OwnerId != currentUserId.Value))
        {
            throw new UnauthorizedAccessException($"You do not have permission to upload images for field {id}");
        }

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var folder = Path.Combine(webRoot, "uploads", "fields");
        var savedFileName = await SaveFileToDirectoryAsync(file, folder, $"field_{id}", AllowedImageExtensions, MaxImageBytes,
            "Only .jpg, .jpeg, .png, and .webp images are supported", cancellationToken);
        field.ImageUrl = $"/uploads/fields/{savedFileName}";

        var updated = await _fieldRepository.UpdateAsync(field, cancellationToken);
        return FieldDto.FromEntity(updated);
    }

    public async Task<FieldDto> UploadVerificationDocAsync(long id, IFormFile file, long? currentUserId = null, bool isAdmin = false, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        if (!isAdmin && (!currentUserId.HasValue || field.OwnerId != currentUserId.Value))
        {
            throw new UnauthorizedAccessException($"You do not have permission to upload verification docs for field {id}");
        }

        var privateDir = GetPrivateVerificationDirectory();
        var savedFileName = await SaveFileToDirectoryAsync(file, privateDir, $"verify_field_{id}", AllowedDocExtensions, MaxDocBytes,
            "Only .jpg, .jpeg, .png, .webp, and .pdf files are supported", cancellationToken);
        field.VerificationDocUrl = savedFileName;

        if (!isAdmin && field.VerificationStatus is "REJECTED" or "PENDING_REVIEW")
        {
            field.VerificationStatus = "PENDING_REVIEW";
            field.IsAvailable = false;
            await _notifications.NotifyAdminsAsync("VERIFICATION", field.Id,
                $"Chủ sân đã cập nhật hồ sơ xác thực cho sân \"{field.Name}\".", cancellationToken);
        }

        var updated = await _fieldRepository.UpdateAsync(field, cancellationToken);
        return FieldDto.FromEntity(updated);
    }

    public async Task<PrivateFileResult> GetVerificationDocAsync(long id, long currentUserId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        // Permission MUST be verified from DB field ownership, never from client-supplied URL or params.
        if (!isAdmin && (!field.OwnerId.HasValue || field.OwnerId.Value != currentUserId))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem tài liệu xác minh của sân này.");
        }

        if (string.IsNullOrWhiteSpace(field.VerificationDocUrl))
        {
            throw new KeyNotFoundException("Sân này chưa có tài liệu xác minh.");
        }

        return ResolvePrivateFile(field.VerificationDocUrl);
    }

    public async Task<FieldDto> VerifyFieldAsync(long id, long adminId, FieldVerifyDto dto, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        var decision = dto.Decision.Trim().ToUpperInvariant();
        if (decision is not ("APPROVED" or "REJECTED" or "SUSPENDED"))
        {
            throw new ArgumentException("Decision must be APPROVED, REJECTED, or SUSPENDED");
        }

        if (decision == "APPROVED")
        {
            field.VerificationStatus = field.VenueSource == "COMMUNITY_UNCLAIMED" ? "UNCLAIMED" : "APPROVED";
            field.IsAvailable = true;
            field.VerifiedAt = DateTime.Now;
            field.VerifiedByAdminId = adminId;
            field.VerificationNotes = string.IsNullOrWhiteSpace(dto.Notes) ? "Đã xác thực bởi Admin." : dto.Notes.Trim();
        }
        else
        {
            field.VerificationStatus = decision;
            field.IsAvailable = false;
            field.VerificationNotes = string.IsNullOrWhiteSpace(dto.Notes)
                ? (decision == "REJECTED" ? "Hồ sơ chưa đạt yêu cầu xác thực." : "Sân tạm ngưng do phản ánh.")
                : dto.Notes.Trim();
        }

        var updated = await _fieldRepository.UpdateAsync(field, cancellationToken);
        if (field.OwnerId.HasValue)
        {
            var msg = decision == "APPROVED"
                ? $"Sân \"{field.Name}\" đã được Admin duyệt xác thực và mở đặt công khai."
                : $"Sân \"{field.Name}\" chuyển trạng thái {decision}. Ghi chú: {field.VerificationNotes}";
            await _notifications.CreateEventAsync(field.OwnerId.Value, "VERIFICATION", field.Id, msg, cancellationToken);
        }

        return FieldDto.FromEntity(updated);
    }

    public async Task<string> UploadClaimEvidenceAsync(IFormFile file, long claimantUserId, CancellationToken cancellationToken = default)
    {
        var privateDir = GetPrivateVerificationDirectory();
        return await SaveFileToDirectoryAsync(file, privateDir, $"claim_user_{claimantUserId}", AllowedDocExtensions, MaxDocBytes,
            "Only .jpg, .jpeg, .png, .webp, and .pdf files are supported", cancellationToken);
    }

    public async Task<PrivateFileResult> GetClaimEvidenceAsync(long claimId, long currentUserId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var claim = await _db.FieldClaimRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == claimId, cancellationToken)
            ?? throw new KeyNotFoundException($"Claim request not found: {claimId}");

        if (!isAdmin && claim.ClaimantUserId != currentUserId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem tài liệu xác minh quyền sở hữu này.");
        }

        if (string.IsNullOrWhiteSpace(claim.EvidenceDocUrl))
        {
            throw new KeyNotFoundException("Yêu cầu này không có tài liệu đính kèm.");
        }

        return ResolvePrivateFile(claim.EvidenceDocUrl);
    }

    public async Task<FieldClaimResponseDto> SubmitClaimAsync(long fieldId, long claimantUserId, FieldClaimCreateDto dto, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(fieldId, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {fieldId}");

        if (field.VenueSource != "COMMUNITY_UNCLAIMED" && field.OwnerId.HasValue)
        {
            throw new ArgumentException("Sân này đã có chủ sở hữu. Nếu có tranh chấp, vui lòng gửi báo cáo.");
        }

        var existingPending = await _db.FieldClaimRequests.AnyAsync(
            c => c.FieldId == fieldId && c.ClaimantUserId == claimantUserId && c.Status == "PENDING", cancellationToken);
        if (existingPending)
        {
            throw new ArgumentException("Bạn đã gửi yêu cầu xác minh quyền sở hữu sân này và đang chờ duyệt.");
        }

        string? validatedEvidenceKey = null;
        if (!string.IsNullOrWhiteSpace(dto.EvidenceDocUrl))
        {
            var rawKey = dto.EvidenceDocUrl.Trim();
            var safeName = Path.GetFileName(rawKey);
            if (!string.Equals(rawKey, safeName, StringComparison.Ordinal) ||
                !safeName.StartsWith($"claim_user_{claimantUserId}_", StringComparison.Ordinal))
            {
                throw new ArgumentException("Mã tài liệu chứng minh không hợp lệ.");
            }
            var fullPath = Path.Combine(GetPrivateVerificationDirectory(), safeName);
            if (!File.Exists(fullPath))
            {
                throw new ArgumentException("Không tìm thấy tệp tài liệu đã tải lên.");
            }
            validatedEvidenceKey = safeName;
        }

        var claim = new FieldClaimRequest
        {
            FieldId = fieldId,
            ClaimantUserId = claimantUserId,
            EvidenceDocUrl = validatedEvidenceKey,
            MapUrl = dto.MapUrl?.Trim(),
            Notes = dto.Notes.Trim(),
            Status = "PENDING"
        };

        _db.FieldClaimRequests.Add(claim);
        await _db.SaveChangesAsync(cancellationToken);

        await _notifications.NotifyAdminsAsync("VERIFICATION", fieldId,
            $"Có yêu cầu nhận quyền sở hữu sân \"{field.Name}\" từ người dùng #{claimantUserId}.", cancellationToken);

        var loaded = await _db.FieldClaimRequests
            .AsNoTracking()
            .Include(c => c.Field)
            .Include(c => c.ClaimantUser)
            .FirstAsync(c => c.Id == claim.Id, cancellationToken);
        return FieldClaimResponseDto.FromEntity(loaded);
    }

    public async Task<List<FieldClaimResponseDto>> GetClaimRequestsAsync(CancellationToken cancellationToken = default)
    {
        var items = await _db.FieldClaimRequests
            .AsNoTracking()
            .Include(c => c.Field)
            .Include(c => c.ClaimantUser)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);
        return items.Select(FieldClaimResponseDto.FromEntity).ToList();
    }

    public async Task<FieldClaimResponseDto> ReviewClaimAsync(long claimId, long adminId, FieldClaimReviewDto dto, CancellationToken cancellationToken = default)
    {
        var claim = await _db.FieldClaimRequests
            .Include(c => c.Field)
            .Include(c => c.ClaimantUser)
            .FirstOrDefaultAsync(c => c.Id == claimId, cancellationToken)
            ?? throw new KeyNotFoundException($"Claim request not found: {claimId}");

        if (claim.Status != "PENDING")
        {
            throw new ArgumentException("Claim request has already been reviewed");
        }

        var decision = dto.Decision.Trim().ToUpperInvariant();
        if (decision is not ("APPROVED" or "REJECTED"))
        {
            throw new ArgumentException("Decision must be APPROVED or REJECTED");
        }

        claim.Status = decision;
        claim.AdminNote = dto.AdminNote?.Trim();
        claim.ReviewedByAdminId = adminId;
        claim.ReviewedAt = DateTime.Now;

        if (decision == "APPROVED")
        {
            claim.Field.OwnerId = claim.ClaimantUserId;
            claim.Field.VenueSource = "PARTNER";
            claim.Field.VerificationStatus = "APPROVED";
            claim.Field.IsAvailable = true;
            claim.Field.VerifiedAt = DateTime.Now;
            claim.Field.VerifiedByAdminId = adminId;
            if (!string.IsNullOrWhiteSpace(claim.EvidenceDocUrl))
            {
                claim.Field.VerificationDocUrl = Path.GetFileName(claim.EvidenceDocUrl);
            }
            if (!string.IsNullOrWhiteSpace(claim.MapUrl))
            {
                claim.Field.MapUrl = claim.MapUrl;
            }

            if (claim.ClaimantUser.Role == "CUSTOMER")
            {
                claim.ClaimantUser.Role = "OWNER";
            }

            await _notifications.CreateEventAsync(claim.ClaimantUserId, "VERIFICATION", claim.FieldId,
                $"Yêu cầu xác minh chủ sân \"{claim.Field.Name}\" đã được duyệt! Vui lòng đăng nhập lại để sử dụng quyền Chủ sân.", cancellationToken);
        }
        else
        {
            await _notifications.CreateEventAsync(claim.ClaimantUserId, "VERIFICATION", claim.FieldId,
                $"Yêu cầu xác minh chủ sân \"{claim.Field.Name}\" bị từ chối. Lý do: {claim.AdminNote ?? "Chưa đủ bằng chứng"}", cancellationToken);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return FieldClaimResponseDto.FromEntity(claim);
    }

    public async Task<FieldReportResponseDto> ReportFieldAsync(long fieldId, long reporterUserId, FieldReportCreateDto dto, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(fieldId, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {fieldId}");

        var report = new FieldReport
        {
            FieldId = fieldId,
            ReporterUserId = reporterUserId,
            Reason = dto.Reason.Trim(),
            Details = dto.Details?.Trim(),
            Status = "OPEN"
        };

        _db.FieldReports.Add(report);
        await _db.SaveChangesAsync(cancellationToken);

        var distinctOpenCount = await _db.FieldReports
            .Where(r => r.FieldId == fieldId && r.Status == "OPEN")
            .Select(r => r.ReporterUserId)
            .Distinct()
            .CountAsync(cancellationToken);

        if (distinctOpenCount >= 3)
        {
            await _notifications.NotifyAdminsAsync("VERIFICATION", fieldId,
                $"Cảnh báo: Sân \"{field.Name}\" nhận {distinctOpenCount} báo cáo sai phạm từ cộng đồng.", cancellationToken);
        }

        var loaded = await _db.FieldReports
            .AsNoTracking()
            .Include(r => r.Field)
            .Include(r => r.ReporterUser)
            .FirstAsync(r => r.Id == report.Id, cancellationToken);
        return FieldReportResponseDto.FromEntity(loaded);
    }

    public async Task<List<FieldReportResponseDto>> GetFieldReportsAsync(CancellationToken cancellationToken = default)
    {
        var reports = await _db.FieldReports
            .AsNoTracking()
            .Include(r => r.Field)
            .Include(r => r.ReporterUser)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
        return reports.Select(FieldReportResponseDto.FromEntity).ToList();
    }

    public async Task<FieldReportResponseDto> ResolveFieldReportAsync(long reportId, FieldReportResolveDto dto, CancellationToken cancellationToken = default)
    {
        var report = await _db.FieldReports
            .Include(r => r.Field)
            .Include(r => r.ReporterUser)
            .FirstOrDefaultAsync(r => r.Id == reportId, cancellationToken)
            ?? throw new KeyNotFoundException($"Report not found: {reportId}");

        var status = dto.Status.Trim().ToUpperInvariant();
        if (status is not ("RESOLVED" or "DISMISSED"))
        {
            throw new ArgumentException("Status must be RESOLVED or DISMISSED");
        }

        report.Status = status;
        if (dto.SuspendField)
        {
            report.Field.VerificationStatus = "SUSPENDED";
            report.Field.IsAvailable = false;
            report.Field.VerificationNotes = string.IsNullOrWhiteSpace(dto.Notes) ? report.Reason : dto.Notes.Trim();
            if (report.Field.OwnerId.HasValue)
            {
                await _notifications.CreateEventAsync(report.Field.OwnerId.Value, "VERIFICATION", report.FieldId,
                    $"Sân \"{report.Field.Name}\" đã bị tạm ngưng để kiểm tra sau phản ánh cộng đồng.", cancellationToken);
            }
        }

        await _db.SaveChangesAsync(cancellationToken);
        return FieldReportResponseDto.FromEntity(report);
    }

    private string GetPrivateVerificationDirectory()
    {
        var dir = Path.Combine(_environment.ContentRootPath, "App_Data", "verification-documents");
        Directory.CreateDirectory(dir);
        return dir;
    }

    private PrivateFileResult ResolvePrivateFile(string storedValue)
    {
        var safeFileName = Path.GetFileName(storedValue.Trim());
        if (string.IsNullOrWhiteSpace(safeFileName))
        {
            throw new KeyNotFoundException("Tài liệu xác minh không tồn tại.");
        }

        var fullPath = Path.Combine(GetPrivateVerificationDirectory(), safeFileName);
        if (!File.Exists(fullPath))
        {
            throw new KeyNotFoundException("Không tìm thấy tệp tài liệu xác minh trong kho lưu trữ.");
        }

        var ext = Path.GetExtension(safeFileName).ToLowerInvariant();
        var contentType = ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };

        return new PrivateFileResult(fullPath, contentType, safeFileName);
    }

    private async Task EnsureNoGeoDuplicateAsync(decimal? lat, decimal? lng, string sportType, long? excludeFieldId, CancellationToken ct)
    {
        if (!lat.HasValue || !lng.HasValue) return;

        var candidates = await _db.Fields.AsNoTracking()
            .Where(f => f.SportType == sportType
                        && f.Latitude != null && f.Longitude != null
                        && f.VerificationStatus != "REJECTED"
                        && (!excludeFieldId.HasValue || f.Id != excludeFieldId.Value))
            .Select(f => new { f.Id, f.Name, f.Latitude, f.Longitude })
            .ToListAsync(ct);

        foreach (var c in candidates)
        {
            var dist = HaversineMeters((double)lat.Value, (double)lng.Value, (double)c.Latitude!.Value, (double)c.Longitude!.Value);
            if (dist <= DuplicateRadiusMeters)
            {
                throw new ArgumentException(
                    $"Phát hiện sân trùng tọa độ trong bán kính {Math.Round(dist)}m (\"{c.Name}\" #{c.Id}). " +
                    "Nếu đây là sân của bạn, hãy sử dụng tính năng Xác minh sở hữu (Claim) thay vì tạo trùng.");
            }
        }
    }

    private static double HaversineMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000.0;
        var dLat = (lat2 - lat1) * Math.PI / 180.0;
        var dLon = (lon2 - lon1) * Math.PI / 180.0;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static string? ResolveMapUrl(string? explicitUrl, decimal? lat, decimal? lng)
    {
        if (!string.IsNullOrWhiteSpace(explicitUrl)) return explicitUrl.Trim();
        if (lat.HasValue && lng.HasValue) return $"https://maps.google.com/?q={lat.Value},{lng.Value}";
        return null;
    }

    private static async Task<string> SaveFileToDirectoryAsync(
        IFormFile file,
        string targetFolder,
        string prefix,
        HashSet<string> allowedExts,
        long maxBytes,
        string extError,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
        {
            throw new ArgumentException("File is required");
        }
        if (file.Length > maxBytes)
        {
            throw new ArgumentException($"File size must not exceed {maxBytes / (1024 * 1024)} MB");
        }
        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !allowedExts.Contains(extension))
        {
            throw new ArgumentException(extError);
        }

        Directory.CreateDirectory(targetFolder);
        var safeFileName = $"{prefix}_{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var fullPath = Path.Combine(targetFolder, safeFileName);
        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, ct);
        }
        return safeFileName;
    }
}
