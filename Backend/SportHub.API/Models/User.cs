using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SportHub.API.Models;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [JsonIgnore]
    [Column("password")]
    public string Password { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("full_name")]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20)]
    [Column("phone")]
    public string? Phone { get; set; }

    [MaxLength(255)]
    [Column("address")]
    public string? Address { get; set; }

    [MaxLength(500)]
    [Column("bio")]
    public string? Bio { get; set; }

    [MaxLength(500)]
    [Column("avatar_url")]
    public string? AvatarUrl { get; set; }

    [MaxLength(20)]
    [Column("role")]
    public string Role { get; set; } = UserRole.CUSTOMER.ToString();

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("elo_rating")]
    public int EloRating { get; set; } = 1000;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    [JsonIgnore]
    public ICollection<Field> OwnedFields { get; set; } = new List<Field>();

    [JsonIgnore]
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    [JsonIgnore]
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
