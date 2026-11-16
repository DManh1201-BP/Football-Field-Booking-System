using System.ComponentModel.DataAnnotations;

namespace SportHub.API.DTOs;

public class BookingUpdateDto : IValidatableObject
{
    [Required(ErrorMessage = "Field ID is required")]
    public long? FieldId { get; set; }

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