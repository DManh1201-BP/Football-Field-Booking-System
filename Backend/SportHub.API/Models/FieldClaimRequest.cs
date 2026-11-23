using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SportHub.API.Models;

[Table("field_claim_requests")]
public class FieldClaimRequest
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("field_id")]
    public long FieldId { get; set; }

    public Field Field { get; set; } = null!;

    [Required]
    [Column("claimant_user_id")]
    public long ClaimantUserId { get; set; }

    public User ClaimantUser { get; set; } = null!;

    [MaxLength(500)]
    [Column("evidence_doc_url")]
    public string? EvidenceDocUrl { get; set; }

    [MaxLength(500)]
    [Column("map_url")]
    public string? MapUrl { get; set; }

    [MaxLength(500)]
    [Column("notes")]
    public string? Notes { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "PENDING";

    [MaxLength(500)]
    [Column("admin_note")]
    public string? AdminNote { get; set; }

    [Column("reviewed_by_admin_id")]
    public long? ReviewedByAdminId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("reviewed_at")]
    public DateTime? ReviewedAt { get; set; }
}
