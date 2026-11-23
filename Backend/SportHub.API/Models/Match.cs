using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SportHub.API.Models;

[Table("matches")]
public class Match
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [MaxLength(150)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("sport_type")]
    public string SportType { get; set; } = string.Empty;

    [MaxLength(50)]
    [Column("skill_level")]
    public string SkillLevel { get; set; } = "INTERMEDIATE";

    [MaxLength(100)]
    [Column("city")]
    public string? City { get; set; }

    [MaxLength(255)]
    [Column("location")]
    public string? Location { get; set; }

    [Column("field_id")]
    public long? FieldId { get; set; }

    public Field? Field { get; set; }

    [Required]
    [Column("host_user_id")]
    public long HostUserId { get; set; }

    public User HostUser { get; set; } = null!;

    [Column("challenger_user_id")]
    public long? ChallengerUserId { get; set; }

    public User? ChallengerUser { get; set; }

    [Required]
    [Column("match_date")]
    public DateOnly MatchDate { get; set; }

    [Required]
    [Column("start_time")]
    public TimeOnly StartTime { get; set; }

    [Required]
    [Column("end_time")]
    public TimeOnly EndTime { get; set; }

    [Column("missing_players")]
    public int MissingPlayers { get; set; } = 1;

    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "OPEN";

    [Column("host_score")]
    public int? HostScore { get; set; }

    [Column("challenger_score")]
    public int? ChallengerScore { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Required]
    [MaxLength(20)]
    [Column("match_mode")]
    public string MatchMode { get; set; } = "TEAM_CHALLENGE";

    [Column("max_slots")]
    public int MaxSlots { get; set; } = 2;

    [Column("pre_reserved_slots")]
    public int PreReservedSlots { get; set; } = 1;

    [Column("booking_id")]
    public long? BookingId { get; set; }

    public Booking? Booking { get; set; }

    [Column("is_ranked")]
    public bool IsRanked { get; set; } = true;

    [Required]
    [MaxLength(30)]
    [Column("score_status")]
    public string ScoreStatus { get; set; } = "NONE";

    [Column("proposed_host_score")]
    public int? ProposedHostScore { get; set; }

    [Column("proposed_challenger_score")]
    public int? ProposedChallengerScore { get; set; }

    [Column("score_submitted_by_user_id")]
    public long? ScoreSubmittedByUserId { get; set; }

    [Column("score_submitted_at")]
    public DateTime? ScoreSubmittedAt { get; set; }

    [Column("score_confirm_deadline")]
    public DateTime? ScoreConfirmDeadline { get; set; }

    [Column("disputed_host_score")]
    public int? DisputedHostScore { get; set; }

    [Column("disputed_challenger_score")]
    public int? DisputedChallengerScore { get; set; }

    [MaxLength(500)]
    [Column("dispute_reason")]
    public string? DisputeReason { get; set; }

    [MaxLength(500)]
    [Column("dispute_evidence_url")]
    public string? DisputeEvidenceUrl { get; set; }

    public ICollection<MatchParticipant> Participants { get; set; } = new List<MatchParticipant>();

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
