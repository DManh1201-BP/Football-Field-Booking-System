using SportHub.API.DTOs;

namespace SportHub.API.Services;

public interface IMatchService
{
    Task<List<MatchResponseDto>> GetMatchesAsync(
        string? sportType = null,
        string? city = null,
        string? skillLevel = null,
        string? status = null,
        CancellationToken cancellationToken = default);
    Task<MatchResponseDto> GetMatchByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> CreateMatchAsync(long hostUserId, MatchCreateDto request, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> JoinMatchAsync(long matchId, long challengerUserId, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> RecordResultAsync(
        long matchId,
        long requesterUserId,
        bool isAdmin,
        MatchResultDto result,
        CancellationToken cancellationToken = default);
    Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int limit = 20, CancellationToken cancellationToken = default);
}
