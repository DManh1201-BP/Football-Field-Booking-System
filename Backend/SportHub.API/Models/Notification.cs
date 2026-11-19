using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SportHub.API.Models;

[Table("notifications")]
public class Notification
{
    [Key, Column("id")]
    public long Id { get; set; }
    [Column("user_id"), Required]
    public long UserId { get; set; }
    public User User { get; set; } = null!;
    [Column("booking_id")]
    public long? BookingId { get; set; }
    public Booking? Booking { get; set; }
    [Column("message"), Required, MaxLength(500)]
    public string Message { get; set; } = string.Empty;
    [Column("is_read")]
    public bool IsRead { get; set; }
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
