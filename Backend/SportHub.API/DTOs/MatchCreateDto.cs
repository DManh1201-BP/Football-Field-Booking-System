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

    public long? BookingId { get; set; }

    [MaxLength(20)]
    public string MatchMode { get; set; } = "TEAM_CHALLENGE"; // TEAM_CHALLENGE | CUSTOM_PRIVATE | SOLO_LOBBY

    [Range(2, 50, ErrorMessage = "Max slots must be between 2 and 50")]
    public int? MaxSlots { get; set; }

    [Range(1, 49, ErrorMessage = "Pre-reserved slots must be between 1 and 49")]
    public int? PreReservedSlots { get; set; }

    public bool? IsRanked { get; set; }

    [Required(ErrorMessage = "Match date is required")]
    public DateOnly? MatchDate { get; set; }

    [Required(ErrorMessage = "Start time is required")]
    public TimeOnly? StartTime { get; set; }

    [Required(ErrorMessage = "End time is required")]
    public TimeOnly? EndTime { get; set; }

    [Range(0, 50, ErrorMessage = "Missing players must be between 0 and 50")]
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

public class MatchJoinDto
{
    [MaxLength(10)]
    public string TeamSide { get; set; } = "ANY"; // A | B | ANY

    [Range(0, 1, ErrorMessage = "Bạn chỉ có thể bảo lãnh tối đa 1 người đi cùng (+1 Guest)")]
    public int GuestCount { get; set; } = 0;
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

public class MatchScoreDisputeDto
{
    [Required]
    [Range(0, 999)]
    public int? HostScore { get; set; }

    [Required]
    [Range(0, 999)]
    public int? ChallengerScore { get; set; }

    [Required(ErrorMessage = "Vui lòng nhập lý do khiếu nại tỉ số")]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? EvidenceUrl { get; set; }
}

public class MatchScoreResolveDto
{
    [Required]
    public string Decision { get; set; } = "CONFIRM"; // CONFIRM | VOID

    [Range(0, 999)]
    public int? HostScore { get; set; }

    [Range(0, 999)]
    public int? ChallengerScore { get; set; }

    public long? PenalizeUserId { get; set; }
}

public class MatchParticipantDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int EloRating { get; set; }
    public int ReliabilityScore { get; set; }
    public string TeamSide { get; set; } = "ANY";
    public int GuestCount { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
    public DateTime? CheckedInAt { get; set; }

    public static MatchParticipantDto FromEntity(MatchParticipant p) => new()
    {
        Id = p.Id,
        UserId = p.UserId,
        FullName = p.User?.FullName ?? $"User #{p.UserId}",
        AvatarUrl = p.User?.AvatarUrl,
        EloRating = p.User?.EloRating ?? 1000,
        ReliabilityScore = p.User?.ReliabilityScore ?? 100,
        TeamSide = p.TeamSide,
        GuestCount = p.GuestCount,
        Status = p.Status,
        JoinedAt = p.JoinedAt,
        CheckedInAt = p.CheckedInAt
    };
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
    public long? BookingId { get; set; }
    public UserProfileResponseDto HostUser { get; set; } = null!;
    public UserProfileResponseDto? ChallengerUser { get; set; }
    public DateOnly MatchDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public string MatchMode { get; set; } = "TEAM_CHALLENGE";
    public int MaxSlots { get; set; }
    public int PreReservedSlots { get; set; }
    public int OccupiedSlots { get; set; }
    public int MissingPlayers { get; set; }
    public int WaitlistCount { get; set; }
    public bool IsRanked { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? HostScore { get; set; }
    public int? ChallengerScore { get; set; }
    public string ScoreStatus { get; set; } = "NONE";
    public int? ProposedHostScore { get; set; }
    public int? ProposedChallengerScore { get; set; }
    public long? ScoreSubmittedByUserId { get; set; }
    public DateTime? ScoreSubmittedAt { get; set; }
    public DateTime? ScoreConfirmDeadline { get; set; }
    public int? DisputedHostScore { get; set; }
    public int? DisputedChallengerScore { get; set; }
    public string? DisputeReason { get; set; }
    public string? DisputeEvidenceUrl { get; set; }
    public string? Notes { get; set; }
    public List<MatchParticipantDto> Participants { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static MatchResponseDto FromEntity(Match match)
    {
        var participants = match.Participants?
            .OrderBy(p => p.JoinedAt)
            .Select(MatchParticipantDto.FromEntity)
            .ToList() ?? new List<MatchParticipantDto>();

        var activeParticipantSlots = match.Participants?
            .Where(p => p.UserId != match.HostUserId && p.Status is "JOINED" or "CHECKED_IN")
            .Sum(p => 1 + p.GuestCount) ?? 0;
        var waitlistCount = match.Participants?
            .Count(p => p.Status == "WAITLISTED") ?? 0;

        var occupied = match.MatchMode == "SOLO_LOBBY"
            ? Math.Min(match.MaxSlots, match.PreReservedSlots + activeParticipantSlots)
            : (match.ChallengerUserId.HasValue ? match.MaxSlots : match.PreReservedSlots);

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
            BookingId = match.BookingId,
            HostUser = UserProfileResponseDto.FromUser(match.HostUser),
            ChallengerUser = match.ChallengerUser is not null
                ? UserProfileResponseDto.FromUser(match.ChallengerUser)
                : null,
            MatchDate = match.MatchDate,
            StartTime = match.StartTime,
            EndTime = match.EndTime,
            MatchMode = match.MatchMode,
            MaxSlots = match.MaxSlots,
            PreReservedSlots = match.PreReservedSlots,
            OccupiedSlots = occupied,
            MissingPlayers = match.MissingPlayers,
            WaitlistCount = waitlistCount,
            IsRanked = match.IsRanked,
            Status = match.Status,
            HostScore = match.HostScore,
            ChallengerScore = match.ChallengerScore,
            ScoreStatus = match.ScoreStatus,
            ProposedHostScore = match.ProposedHostScore,
            ProposedChallengerScore = match.ProposedChallengerScore,
            ScoreSubmittedByUserId = match.ScoreSubmittedByUserId,
            ScoreSubmittedAt = match.ScoreSubmittedAt,
            ScoreConfirmDeadline = match.ScoreConfirmDeadline,
            DisputedHostScore = match.DisputedHostScore,
            DisputedChallengerScore = match.DisputedChallengerScore,
            DisputeReason = match.DisputeReason,
            DisputeEvidenceUrl = match.DisputeEvidenceUrl,
            Notes = match.Notes,
            Participants = participants,
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
    public string? SportType { get; set; }
    public int EloRating { get; set; }
    public int ReliabilityScore { get; set; } = 100;
    public int MatchesPlayed { get; set; }
}
