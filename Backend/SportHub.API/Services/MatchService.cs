using SportHub.API.DTOs;
using SportHub.API.Models;
using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class MatchService : IMatchService
{
    private const int EloKFactor = 32;

    private readonly IMatchRepository _matchRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFieldRepository _fieldRepository;

    public MatchService(
        IMatchRepository matchRepository,
        IUserRepository userRepository,
        IFieldRepository fieldRepository)
    {
        _matchRepository = matchRepository;
        _userRepository = userRepository;
        _fieldRepository = fieldRepository;
    }

    public async Task<List<MatchResponseDto>> GetMatchesAsync(
        string? sportType = null,
        string? city = null,
        string? skillLevel = null,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        var matches = await _matchRepository.GetAllAsync(sportType, city, skillLevel, status, cancellationToken);
        return matches.Select(MatchResponseDto.FromEntity).ToList();
    }

    public async Task<MatchResponseDto> GetMatchByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {id}");

        return MatchResponseDto.FromEntity(match);
    }

    public async Task<MatchResponseDto> CreateMatchAsync(
        long hostUserId,
        MatchCreateDto request,
        CancellationToken cancellationToken = default)
    {
        var hostUser = await _userRepository.GetByIdAsync(hostUserId, cancellationToken)
            ?? throw new KeyNotFoundException($"User not found: {hostUserId}");

        Field? field = null;
        if (request.FieldId.HasValue)
        {
            field = await _fieldRepository.GetByIdAsync(request.FieldId.Value, cancellationToken)
                ?? throw new KeyNotFoundException($"Field not found: {request.FieldId.Value}");
        }

        var match = new Match
        {
            Title = request.Title.Trim(),
            SportType = request.SportType.Trim().ToUpperInvariant(),
            SkillLevel = string.IsNullOrWhiteSpace(request.SkillLevel)
                ? "INTERMEDIATE"
                : request.SkillLevel.Trim().ToUpperInvariant(),
            City = request.City?.Trim() ?? field?.City,
            Location = request.Location?.Trim() ?? field?.Location,
            FieldId = field?.Id,
            Field = field,
            HostUserId = hostUser.Id,
            HostUser = hostUser,
            MatchDate = request.MatchDate ?? throw new ArgumentException("Match date is required"),
            StartTime = request.StartTime ?? throw new ArgumentException("Start time is required"),
            EndTime = request.EndTime ?? throw new ArgumentException("End time is required"),
            MissingPlayers = request.MissingPlayers,
            Status = "OPEN",
            Notes = request.Notes?.Trim()
        };

        var saved = await _matchRepository.AddAsync(match, cancellationToken);
        return MatchResponseDto.FromEntity(saved);
    }

    public async Task<MatchResponseDto> JoinMatchAsync(
        long matchId,
        long challengerUserId,
        CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        if (!string.Equals(match.Status, "OPEN", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Match is no longer open for joining");
        }

        if (match.HostUserId == challengerUserId)
        {
            throw new ArgumentException("Host cannot join their own match as challenger");
        }

        var challenger = await _userRepository.GetByIdAsync(challengerUserId, cancellationToken)
            ?? throw new KeyNotFoundException($"User not found: {challengerUserId}");

        match.ChallengerUserId = challenger.Id;
        match.ChallengerUser = challenger;
        match.MissingPlayers = Math.Max(0, match.MissingPlayers - 1);
        if (match.MissingPlayers == 0)
        {
            match.Status = "MATCHED";
        }

        var updated = await _matchRepository.UpdateAsync(match, cancellationToken);
        return MatchResponseDto.FromEntity(updated);
    }

    public async Task<MatchResponseDto> RecordResultAsync(
        long matchId,
        long requesterUserId,
        bool isAdmin,
        MatchResultDto result,
        CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        if (!isAdmin && match.HostUserId != requesterUserId)
        {
            throw new UnauthorizedAccessException("Only the match host or admin can submit match results");
        }

        if (string.Equals(match.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Match result has already been recorded");
        }

        if (match.ChallengerUser is null || !match.ChallengerUserId.HasValue)
        {
            throw new ArgumentException("Cannot record result for a match without an opponent");
        }

        var hostScore = result.HostScore ?? throw new ArgumentException("Host score is required");
        var challengerScore = result.ChallengerScore ?? throw new ArgumentException("Challenger score is required");

        match.HostScore = hostScore;
        match.ChallengerScore = challengerScore;
        match.Status = "COMPLETED";

        UpdateEloRatings(match.HostUser, match.ChallengerUser, hostScore, challengerScore);
        await _userRepository.UpdateAsync(match.HostUser, cancellationToken);
        await _userRepository.UpdateAsync(match.ChallengerUser, cancellationToken);

        var updated = await _matchRepository.UpdateAsync(match, cancellationToken);
        return MatchResponseDto.FromEntity(updated);
    }

    public async Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int limit = 20, CancellationToken cancellationToken = default)
    {
        var clampedLimit = Math.Clamp(limit, 1, 100);
        var users = await _userRepository.GetLeaderboardAsync(clampedLimit, cancellationToken);
        return users.Select((u, idx) => new LeaderboardEntryDto
        {
            Rank = idx + 1,
            UserId = u.Id,
            FullName = u.FullName,
            Address = u.Address,
            EloRating = u.EloRating
        }).ToList();
    }

    private static void UpdateEloRatings(User host, User challenger, int hostScore, int challengerScore)
    {
        var expectedHost = 1.0 / (1.0 + Math.Pow(10.0, (challenger.EloRating - host.EloRating) / 400.0));
        var expectedChallenger = 1.0 - expectedHost;

        var actualHost = hostScore > challengerScore ? 1.0 : (hostScore < challengerScore ? 0.0 : 0.5);
        var actualChallenger = 1.0 - actualHost;

        host.EloRating = Math.Max(100, (int)Math.Round(host.EloRating + EloKFactor * (actualHost - expectedHost)));
        challenger.EloRating = Math.Max(100, (int)Math.Round(challenger.EloRating + EloKFactor * (actualChallenger - expectedChallenger)));
    }
}
