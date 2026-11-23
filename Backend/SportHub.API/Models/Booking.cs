using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace SportHub.API.Models;

[Table("bookings")]
public class Booking
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    public User User { get; set; } = null!;

    [Required]
    [Column("field_id")]
    public long FieldId { get; set; }

    public Field Field { get; set; } = null!;

    [Required]
    [Column("booking_date")]
    public DateOnly BookingDate { get; set; }

    [Required]
    [Column("start_time")]
    public TimeOnly StartTime { get; set; }

    [Required]
    [Column("end_time")]
    public TimeOnly EndTime { get; set; }

    [Required]
    [Column("total_price", TypeName = "decimal(10, 2)")]
    public decimal TotalPrice { get; set; }

    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "PENDING";

    [Column("hold_expires_at")]
    public DateTime? HoldExpiresAt { get; set; }

    [MaxLength(20)]
    [Column("customer_phone")]
    public string? CustomerPhone { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Timestamp]
    [JsonIgnore]
    [Column("row_version")]
    public byte[]? RowVersion { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    [MaxLength(300)]
    [Column("cancellation_reason")]
    public string? CancellationReason { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("booking_type")]
    public string BookingType { get; set; } = "ONLINE";

    [Column("expected_players")]
    public int? ExpectedPlayers { get; set; }

    [Column("deposit_amount", TypeName = "decimal(10, 2)")]
    public decimal DepositAmount { get; set; } = 0m;

    [Required]
    [MaxLength(20)]
    [Column("payment_status")]
    public string PaymentStatus { get; set; } = "UNPAID";

    [MaxLength(120)]
    [Column("cancellation_policy_applied")]
    public string? CancellationPolicyApplied { get; set; }

    [Column("checked_in_at")]
    public DateTime? CheckedInAt { get; set; }
}
