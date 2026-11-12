using System.ComponentModel.DataAnnotations;
using SportHub.API.Models;

namespace SportHub.API.DTOs;

public class MatchCreateDto : IValidatableObject
{
    [Required(ErrorMessage = "Match title is required")]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Sport type is required")]
    [MaxLength(50)]
    public string SportType { get; set; } = string.Empty;

    [MaxLength(50)]
    public string SkillLevel { get; set; } = "INTERMEDIATE";

    [MaxLength(100)]
    public string? City { get; set; }

    [MaxLength(255)]
    public string? Location { get; set; }

    public long? FieldId { get; set; }

    [Required(ErrorMessage = "Match date is required")]
    public DateOnly? MatchDate { get; set; }

    [Required(ErrorMessage = "Start time is required")]
    public TimeOnly? StartTime { get; set; }

    [Required(ErrorMessage = "End time is required")]
    public TimeOnly? EndTime { get; set; }

    [Range(1, 30, ErrorMessage = "Missing players must be between 1 and 30")]
    public int MissingPlayers { get; set; } = 1;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (MatchDate.HasValue && MatchDate.Value < DateOnly.FromDateTime(DateTime.Today))
        {
            yield return new ValidationResult(
                "Match date must be today or later",
                new[] { nameof(MatchDate) });
        }

        if (StartTime.HasValue && EndTime.HasValue && EndTime.Value <= StartTime.Value)
        {
            yield return new ValidationResult(
                "End time must be after start time",
                new[] { nameof(EndTime) });
        }
    }
}

public class MatchResultDto
{
    [Required]
    [Range(0, 999)]
    public int? HostScore { get; set; }

    [Required]
    [Range(0, 999)]
    public int? ChallengerScore { get; set; }
}

public class MatchResponseDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string SportType { get; set; } = string.Empty;
    public string SkillLevel { get; set; } = string.Empty;
    public string? City { get; set; }
    public string? Location { get; set; }
    public long? FieldId { get; set; }
    public FieldDto? Field { get; set; }
    public UserProfileResponseDto HostUser { get; set; } = null!;
    public UserProfileResponseDto? ChallengerUser { get; set; }
    public DateOnly MatchDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public int MissingPlayers { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? HostScore { get; set; }
    public int? ChallengerScore { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static MatchResponseDto FromEntity(Match match)
    {
        return new MatchResponseDto
        {
            Id = match.Id,
            Title = match.Title,
            SportType = match.SportType,
            SkillLevel = match.SkillLevel,
            City = match.City,
            Location = match.Location,
            FieldId = match.FieldId,
            Field = match.Field is not null ? FieldDto.FromEntity(match.Field) : null,
            HostUser = UserProfileResponseDto.FromUser(match.HostUser),
            ChallengerUser = match.ChallengerUser is not null
                ? UserProfileResponseDto.FromUser(match.ChallengerUser)
                : null,
            MatchDate = match.MatchDate,
            StartTime = match.StartTime,
            EndTime = match.EndTime,
            MissingPlayers = match.MissingPlayers,
            Status = match.Status,
            HostScore = match.HostScore,
            ChallengerScore = match.ChallengerScore,
            Notes = match.Notes,
            CreatedAt = match.CreatedAt,
            UpdatedAt = match.UpdatedAt
        };
    }
}

public class LeaderboardEntryDto
{
    public int Rank { get; set; }
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Address { get; set; }
    public int EloRating { get; set; }
}
