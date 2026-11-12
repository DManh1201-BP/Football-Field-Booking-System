using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SportHub.API.Models;

[Table("fields")]
public class Field
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [MaxLength(150)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("location")]
    public string Location { get; set; } = string.Empty;

    [MaxLength(100)]
    [Column("city")]
    public string? City { get; set; }

    [MaxLength(100)]
    [Column("province")]
    public string? Province { get; set; }

    [Column("image_url")]
    public string? ImageUrl { get; set; }

    [Required]
    [Column("price_per_hour", TypeName = "decimal(10, 2)")]
    public decimal PricePerHour { get; set; }

    [Column("capacity")]
    public int? Capacity { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("sport_type")]
    public string SportType { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("amenities")]
    public string? Amenities { get; set; }

    [Column("is_available")]
    public bool IsAvailable { get; set; } = true;

    [Column("owner_id")]
    public long? OwnerId { get; set; }

    [JsonIgnore]
    public User? Owner { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    [JsonIgnore]
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
