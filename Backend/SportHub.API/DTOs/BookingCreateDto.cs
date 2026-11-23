using System.ComponentModel.DataAnnotations;
using SportHub.API.Models;

namespace SportHub.API.DTOs;

public class BookingCreateDto : IValidatableObject
{
    [Required(ErrorMessage = "Field ID is required")]
    public long? FieldId { get; set; }

    public long? UserId { get; set; }

    [Required(ErrorMessage = "Booking date is required")]
    public DateOnly? BookingDate { get; set; }

    [Required(ErrorMessage = "Start time is required")]
    public TimeOnly? StartTime { get; set; }

    [Required(ErrorMessage = "End time is required")]
    public TimeOnly? EndTime { get; set; }

    [Required(ErrorMessage = "Customer phone is required")]
    [MaxLength(20, ErrorMessage = "Customer phone must be at most 20 characters")]
    public string CustomerPhone { get; set; } = string.Empty;

    [MaxLength(1000, ErrorMessage = "Notes must be at most 1000 characters")]
    public string? Notes { get; set; }

    public bool HoldOnly { get; set; } = false;

    [Range(1, 100, ErrorMessage = "Expected players must be between 1 and 100")]
    public int? ExpectedPlayers { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (BookingDate.HasValue && BookingDate.Value < DateOnly.FromDateTime(DateTime.Today))
        {
            yield return new ValidationResult(
                "Booking date must be today or later",
                new[] { nameof(BookingDate) });
        }

        if (StartTime.HasValue && EndTime.HasValue && EndTime.Value <= StartTime.Value)
        {
            yield return new ValidationResult(
                "End time must be after start time",
                new[] { nameof(EndTime) });
        }
    }
}

public class BookingResponseDto
{
    public long Id { get; set; }
    public UserProfileResponseDto User { get; set; } = null!;
    public FieldDto Field { get; set; } = null!;
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? HoldExpiresAt { get; set; }
    public string? CustomerPhone { get; set; }
    public string? Notes { get; set; }
    public string? CancellationReason { get; set; }
    public string BookingType { get; set; } = "ONLINE";
    public int? ExpectedPlayers { get; set; }
    public decimal DepositAmount { get; set; }
    public string PaymentStatus { get; set; } = "UNPAID";
    public string? CancellationPolicyApplied { get; set; }
    public DateTime? CheckedInAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static BookingResponseDto FromEntity(Booking booking)
    {
        return new BookingResponseDto
        {
            Id = booking.Id,
            User = UserProfileResponseDto.FromUser(booking.User),
            Field = FieldDto.FromEntity(booking.Field),
            BookingDate = booking.BookingDate,
            StartTime = booking.StartTime,
            EndTime = booking.EndTime,
            TotalPrice = booking.TotalPrice,
            Status = booking.Status,
            HoldExpiresAt = booking.HoldExpiresAt,
            CustomerPhone = booking.CustomerPhone,
            Notes = booking.Notes,
            CancellationReason = booking.CancellationReason,
            BookingType = booking.BookingType,
            ExpectedPlayers = booking.ExpectedPlayers,
            DepositAmount = booking.DepositAmount,
            PaymentStatus = booking.PaymentStatus,
            CancellationPolicyApplied = booking.CancellationPolicyApplied,
            CheckedInAt = booking.CheckedInAt,
            CreatedAt = booking.CreatedAt,
            UpdatedAt = booking.UpdatedAt
        };
    }
}

public class WalkInBookingCreateDto : IValidatableObject
{
    [Required(ErrorMessage = "Field ID is required")]
    public long? FieldId { get; set; }

    [Required(ErrorMessage = "Booking date is required")]
    public DateOnly? BookingDate { get; set; }

    [Required(ErrorMessage = "Start time is required")]
    public TimeOnly? StartTime { get; set; }

    [Required(ErrorMessage = "End time is required")]
    public TimeOnly? EndTime { get; set; }

    [Required(ErrorMessage = "Customer name is required")]
    [MaxLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? CustomerPhone { get; set; }

    [Range(1, 100)]
    public int? ExpectedPlayers { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (BookingDate.HasValue && BookingDate.Value < DateOnly.FromDateTime(DateTime.Today))
        {
            yield return new ValidationResult("Booking date must be today or later", new[] { nameof(BookingDate) });
        }
        if (StartTime.HasValue && EndTime.HasValue && EndTime.Value <= StartTime.Value)
        {
            yield return new ValidationResult("End time must be after start time", new[] { nameof(EndTime) });
        }
    }
}

public class RainOutDto
{
    [MaxLength(300)]
    public string? Reason { get; set; }
}

public class PublicBookingScheduleDto
{
    public DateOnly BookingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string Status { get; set; } = string.Empty;

    public static PublicBookingScheduleDto FromEntity(Booking booking) => new()
    {
        BookingDate = booking.BookingDate,
        StartTime = booking.StartTime,
        EndTime = booking.EndTime,
        Status = booking.Status
    };
}
