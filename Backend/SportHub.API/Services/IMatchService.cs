using Microsoft.AspNetCore.Http;
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
    Task<MatchResponseDto> JoinMatchAsync(long matchId, long challengerUserId, MatchJoinDto? joinDto = null, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> LeaveMatchAsync(long matchId, long userId, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> CheckInParticipantAsync(long matchId, long userId, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> MarkNoShowAsync(long matchId, long targetUserId, long requesterUserId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> ProposeScoreAsync(long matchId, long requesterUserId, bool isAdmin, MatchResultDto result, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> ConfirmScoreAsync(long matchId, long requesterUserId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> DisputeScoreAsync(long matchId, long requesterUserId, MatchScoreDisputeDto dispute, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> ResolveScoreAsync(long matchId, long requesterUserId, bool isAdmin, MatchScoreResolveDto resolve, CancellationToken cancellationToken = default);
    Task<string> UploadDisputeEvidenceAsync(long matchId, long requesterUserId, IFormFile file, CancellationToken cancellationToken = default);
    Task<MatchResponseDto> RecordResultAsync(
        long matchId,
        long requesterUserId,
        bool isAdmin,
        MatchResultDto result,
        CancellationToken cancellationToken = default);
    Task<int> AutoConfirmElapsedScoresAsync(CancellationToken cancellationToken = default);
    Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int limit = 20, string? sportType = null, CancellationToken cancellationToken = default);
}
