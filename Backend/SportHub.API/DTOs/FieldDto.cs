using System.ComponentModel.DataAnnotations;
using SportHub.API.Models;

namespace SportHub.API.DTOs;

public class PublicFieldDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? ImageUrl { get; set; }
    public decimal PricePerHour { get; set; }
    public int? Capacity { get; set; }
    public string SportType { get; set; } = string.Empty;
    public string? Amenities { get; set; }
    public bool IsAvailable { get; set; }
    public long? OwnerId { get; set; }
    public string VenueSource { get; set; } = "PARTNER";
    public string VerificationStatus { get; set; } = "APPROVED";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? MapUrl { get; set; }
    public bool IsIndoor { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static PublicFieldDto FromEntity(Field field)
    {
        return new PublicFieldDto
        {
            Id = field.Id,
            Name = field.Name,
            Description = field.Description,
            Location = field.Location,
            City = field.City,
            Province = field.Province,
            ImageUrl = field.ImageUrl,
            PricePerHour = field.PricePerHour,
            Capacity = field.Capacity,
            SportType = field.SportType,
            Amenities = field.Amenities,
            IsAvailable = field.IsAvailable,
            OwnerId = field.OwnerId,
            VenueSource = field.VenueSource,
            VerificationStatus = field.VerificationStatus,
            Latitude = field.Latitude,
            Longitude = field.Longitude,
            MapUrl = field.MapUrl,
            IsIndoor = field.IsIndoor,
            CreatedAt = field.CreatedAt,
            UpdatedAt = field.UpdatedAt
        };
    }
}

public class FieldDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Location { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? Province { get; set; }
    public string? ImageUrl { get; set; }
    public decimal PricePerHour { get; set; }
    public int? Capacity { get; set; }
    public string SportType { get; set; } = string.Empty;
    public string? Amenities { get; set; }
    public bool IsAvailable { get; set; }
    public long? OwnerId { get; set; }
    public string VenueSource { get; set; } = "PARTNER";
    public string VerificationStatus { get; set; } = "APPROVED";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? MapUrl { get; set; }
    public bool HasVerificationDoc { get; set; }
    public string? VerificationDocUrl { get; set; }
    public string? VerificationNotes { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public bool IsIndoor { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static FieldDto FromEntity(Field field)
    {
        var hasDoc = !string.IsNullOrWhiteSpace(field.VerificationDocUrl);
        return new FieldDto
        {
            Id = field.Id,
            Name = field.Name,
            Description = field.Description,
            Location = field.Location,
            City = field.City,
            Province = field.Province,
            ImageUrl = field.ImageUrl,
            PricePerHour = field.PricePerHour,
            Capacity = field.Capacity,
            SportType = field.SportType,
            Amenities = field.Amenities,
            IsAvailable = field.IsAvailable,
            OwnerId = field.OwnerId,
            VenueSource = field.VenueSource,
            VerificationStatus = field.VerificationStatus,
            Latitude = field.Latitude,
            Longitude = field.Longitude,
            MapUrl = field.MapUrl,
            HasVerificationDoc = hasDoc,
            VerificationDocUrl = hasDoc ? $"/api/fields/{field.Id}/verification-doc" : null,
            VerificationNotes = field.VerificationNotes,
            VerifiedAt = field.VerifiedAt,
            IsIndoor = field.IsIndoor,
            CreatedAt = field.CreatedAt,
            UpdatedAt = field.UpdatedAt
        };
    }
}

public class FieldCreateDto
{
    [Required(ErrorMessage = "Field name is required")]
    [MaxLength(150, ErrorMessage = "Field name must be at most 150 characters")]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [Required(ErrorMessage = "Location is required")]
    [MaxLength(255, ErrorMessage = "Location must be at most 255 characters")]
    public string Location { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? Province { get; set; }

    public string? ImageUrl { get; set; }

    [Required(ErrorMessage = "Price per hour is required")]
    [Range(typeof(decimal), "0.01", "99999999.99", ErrorMessage = "Price per hour must be greater than 0")]
    public decimal? PricePerHour { get; set; }

    [Range(1, 1000, ErrorMessage = "Capacity must be between 1 and 1000")]
    public int? Capacity { get; set; }

    [Required(ErrorMessage = "Sport type is required")]
    [MaxLength(50, ErrorMessage = "Sport type must be at most 50 characters")]
    public string SportType { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Amenities { get; set; }

    public bool? IsAvailable { get; set; } = true;

    public long? OwnerId { get; set; }

    [MaxLength(30)]
    public string? VenueSource { get; set; }

    [Range(-90, 90)]
    public decimal? Latitude { get; set; }

    [Range(-180, 180)]
    public decimal? Longitude { get; set; }

    [MaxLength(500)]
    public string? MapUrl { get; set; }

    public bool IsIndoor { get; set; } = false;
}

public class FieldUpdateDto
{
    [MaxLength(150, ErrorMessage = "Field name must be at most 150 characters")]
    public string? Name { get; set; }

    public string? Description { get; set; }

    [MaxLength(255, ErrorMessage = "Location must be at most 255 characters")]
    public string? Location { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? Province { get; set; }

    public string? ImageUrl { get; set; }

    [Range(typeof(decimal), "0.01", "99999999.99", ErrorMessage = "Price per hour must be greater than 0")]
    public decimal? PricePerHour { get; set; }

    [Range(1, 1000, ErrorMessage = "Capacity must be between 1 and 1000")]
    public int? Capacity { get; set; }

    [MaxLength(50, ErrorMessage = "Sport type must be at most 50 characters")]
    public string? SportType { get; set; }

    [MaxLength(500)]
    public string? Amenities { get; set; }

    public bool? IsAvailable { get; set; }

    public long? OwnerId { get; set; }

    public bool ClearOwner { get; set; }

    [MaxLength(30)]
    public string? VenueSource { get; set; }

    [Range(-90, 90)]
    public decimal? Latitude { get; set; }

    [Range(-180, 180)]
    public decimal? Longitude { get; set; }

    [MaxLength(500)]
    public string? MapUrl { get; set; }

    public bool? IsIndoor { get; set; }
}

public class FieldVerifyDto
{
    [Required]
    [MaxLength(30)]
    public string Decision { get; set; } = "APPROVED"; // APPROVED | REJECTED | SUSPENDED

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class CommunityFieldSuggestDto
{
    [Required(ErrorMessage = "Field name is required")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Location is required")]
    [MaxLength(255)]
    public string Location { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(100)]
    public string? Province { get; set; }

    [Required(ErrorMessage = "Sport type is required")]
    [MaxLength(50)]
    public string SportType { get; set; } = "FOOTBALL";

    [Range(1, 1000)]
    public int? Capacity { get; set; }

    [Range(-90, 90)]
    public decimal? Latitude { get; set; }

    [Range(-180, 180)]
    public decimal? Longitude { get; set; }

    [MaxLength(500)]
    public string? MapUrl { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsIndoor { get; set; } = false;
}

public class FieldClaimCreateDto
{
    [MaxLength(500)]
    public string? MapUrl { get; set; }

    [MaxLength(500)]
    public string? EvidenceDocUrl { get; set; }

    [Required(ErrorMessage = "Please describe your ownership proof")]
    [MaxLength(500)]
    public string Notes { get; set; } = string.Empty;
}

public class FieldClaimReviewDto
{
    [Required]
    public string Decision { get; set; } = "APPROVED"; // APPROVED | REJECTED

    [MaxLength(500)]
    public string? AdminNote { get; set; }
}

public class FieldClaimResponseDto
{
    public long Id { get; set; }
    public long FieldId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public long ClaimantUserId { get; set; }
    public string ClaimantName { get; set; } = string.Empty;
    public string ClaimantEmail { get; set; } = string.Empty;
    public bool HasEvidenceDoc { get; set; }
    public string? EvidenceDocUrl { get; set; }
    public string? MapUrl { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public static FieldClaimResponseDto FromEntity(FieldClaimRequest entity)
    {
        var hasEvidence = !string.IsNullOrWhiteSpace(entity.EvidenceDocUrl);
        return new FieldClaimResponseDto
        {
            Id = entity.Id,
            FieldId = entity.FieldId,
            FieldName = entity.Field?.Name ?? $"#{entity.FieldId}",
            ClaimantUserId = entity.ClaimantUserId,
            ClaimantName = entity.ClaimantUser?.FullName ?? "Người dùng",
            ClaimantEmail = entity.ClaimantUser?.Email ?? string.Empty,
            HasEvidenceDoc = hasEvidence,
            EvidenceDocUrl = hasEvidence ? $"/api/admin/field-claims/{entity.Id}/evidence" : null,
            MapUrl = entity.MapUrl,
            Notes = entity.Notes,
            Status = entity.Status,
            AdminNote = entity.AdminNote,
            CreatedAt = entity.CreatedAt,
            ReviewedAt = entity.ReviewedAt
        };
    }
}

public class FieldReportCreateDto
{
    [Required(ErrorMessage = "Reason is required")]
    [MaxLength(100)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Details { get; set; }
}

public class FieldReportResolveDto
{
    [Required]
    public string Status { get; set; } = "RESOLVED"; // RESOLVED | DISMISSED

    public bool SuspendField { get; set; } = false;

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class FieldReportResponseDto
{
    public long Id { get; set; }
    public long FieldId { get; set; }
    public string FieldName { get; set; } = string.Empty;
    public long ReporterUserId { get; set; }
    public string ReporterName { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public static FieldReportResponseDto FromEntity(FieldReport entity) => new()
    {
        Id = entity.Id,
        FieldId = entity.FieldId,
        FieldName = entity.Field?.Name ?? $"#{entity.FieldId}",
        ReporterUserId = entity.ReporterUserId,
        ReporterName = entity.ReporterUser?.FullName ?? "Người dùng",
        Reason = entity.Reason,
        Details = entity.Details,
        Status = entity.Status,
        CreatedAt = entity.CreatedAt
    };
}

public class FieldSearchQueryDto
{
    public string? City { get; set; }
    public string? SportType { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? Amenity { get; set; }
    public DateOnly? Date { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
}
