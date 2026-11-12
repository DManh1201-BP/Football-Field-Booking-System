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
            CreatedAt = booking.CreatedAt,
            UpdatedAt = booking.UpdatedAt
        };
    }
}
