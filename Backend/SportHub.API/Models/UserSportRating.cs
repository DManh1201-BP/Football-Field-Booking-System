using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SportHub.API.Models;

[Table("user_sport_ratings")]
public class UserSportRating
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Required]
    [Column("user_id")]
    public long UserId { get; set; }

    public User User { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    [Column("sport_type")]
    public string SportType { get; set; } = string.Empty;

    [Column("elo_rating")]
    public int EloRating { get; set; } = 1000;

    [Column("matches_played")]
    public int MatchesPlayed { get; set; } = 0;

    [Column("wins")]
    public int Wins { get; set; } = 0;

    [Column("draws")]
    public int Draws { get; set; } = 0;

    [Column("losses")]
    public int Losses { get; set; } = 0;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
