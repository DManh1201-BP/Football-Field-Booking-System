using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SportHub.API.Models;

[Table("field_reports")]
public class FieldReport
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("field_id")]
    public long FieldId { get; set; }

    public Field Field { get; set; } = null!;

    [Required]
    [Column("reporter_user_id")]
    public long ReporterUserId { get; set; }

    public User ReporterUser { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    [Column("reason")]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(500)]
    [Column("details")]
    public string? Details { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "OPEN";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
