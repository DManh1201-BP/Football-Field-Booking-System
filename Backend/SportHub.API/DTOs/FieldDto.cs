using System.ComponentModel.DataAnnotations;
using SportHub.API.Models;

namespace SportHub.API.DTOs;

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
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static FieldDto FromEntity(Field field)
    {
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
