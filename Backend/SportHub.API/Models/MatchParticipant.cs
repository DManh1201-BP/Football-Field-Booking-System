using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SportHub.API.Models;

[Table("match_participants")]
public class MatchParticipant
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("match_id")]
    public long MatchId { get; set; }

    public Match Match { get; set; } = null!;

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    public User User { get; set; } = null!;

    [Required]
    [MaxLength(10)]
    [Column("team_side")]
    public string TeamSide { get; set; } = "ANY";

    [Column("guest_count")]
    public int GuestCount { get; set; } = 0;

    [Required]
    [MaxLength(20)]
    [Column("status")]
    public string Status { get; set; } = "JOINED";

    [Column("joined_at")]
    public DateTime JoinedAt { get; set; } = DateTime.Now;

    [Column("checked_in_at")]
    public DateTime? CheckedInAt { get; set; }
}
