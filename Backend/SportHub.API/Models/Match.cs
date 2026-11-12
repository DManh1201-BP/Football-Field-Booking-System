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

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
