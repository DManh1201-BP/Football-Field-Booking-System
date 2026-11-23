using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SportHub.API.DTOs;
using SportHub.API.Services;

namespace SportHub.API.Controllers;

[ApiController]
[Route("api/matches")]
public class MatchController : ControllerBase
{
    private readonly IMatchService _matchService;

    public MatchController(IMatchService matchService)
    {
        _matchService = matchService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<MatchResponseDto>>> GetMatches(
        [FromQuery] string? sportType,
        [FromQuery] string? city,
        [FromQuery] string? skillLevel,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        var matches = await _matchService.GetMatchesAsync(sportType, city, skillLevel, status, cancellationToken);
        return Ok(matches);
    }

    [HttpGet("{id:long}")]
    [AllowAnonymous]
    public async Task<ActionResult<MatchResponseDto>> GetMatchById(long id, CancellationToken cancellationToken)
    {
        var match = await _matchService.GetMatchByIdAsync(id, cancellationToken);
        return Ok(match);
    }

    [HttpGet("leaderboard")]
    [AllowAnonymous]
    public async Task<ActionResult<List<LeaderboardEntryDto>>> GetLeaderboard(
        [FromQuery] int limit = 20,
        [FromQuery] string? sportType = null,
        CancellationToken cancellationToken = default)
    {
        var leaderboard = await _matchService.GetLeaderboardAsync(limit, sportType, cancellationToken);
        return Ok(leaderboard);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> CreateMatch(
        [FromBody] MatchCreateDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        var created = await _matchService.CreateMatchAsync(userId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPost("{id:long}/join")]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> JoinMatch(
        long id,
        [FromBody] MatchJoinDto? request = null,
        CancellationToken cancellationToken = default)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        var updated = await _matchService.JoinMatchAsync(id, userId, request, cancellationToken);
        return Ok(updated);
    }

    [HttpPost("{id:long}/leave")]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> LeaveMatch(long id, CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _matchService.LeaveMatchAsync(id, userId, cancellationToken));
    }

    [HttpPost("{id:long}/check-in")]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> CheckIn(long id, CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _matchService.CheckInParticipantAsync(id, userId, cancellationToken));
    }

    [HttpPost("{id:long}/no-show/{targetUserId:long}")]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> MarkNoShow(long id, long targetUserId, CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _matchService.MarkNoShowAsync(id, targetUserId, userId, User.IsAdmin(), cancellationToken));
    }

    [HttpPost("{id:long}/score/propose")]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> ProposeScore(
        long id,
        [FromBody] MatchResultDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _matchService.ProposeScoreAsync(id, userId, User.IsAdmin(), request, cancellationToken));
    }

    [HttpPost("{id:long}/score/confirm")]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> ConfirmScore(long id, CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _matchService.ConfirmScoreAsync(id, userId, User.IsAdmin(), cancellationToken));
    }

    [HttpPost("{id:long}/score/dispute")]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> DisputeScore(
        long id,
        [FromBody] MatchScoreDisputeDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _matchService.DisputeScoreAsync(id, userId, request, cancellationToken));
    }

    [HttpPost("{id:long}/dispute-evidence")]
    [Authorize]
    public async Task<ActionResult<object>> UploadDisputeEvidence(
        long id,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        var url = await _matchService.UploadDisputeEvidenceAsync(id, userId, file, cancellationToken);
        return Ok(new { url });
    }

    [HttpPatch("{id:long}/score/resolve")]
    [Authorize(Roles = "ADMIN,OWNER")]
    public async Task<ActionResult<MatchResponseDto>> ResolveScore(
        long id,
        [FromBody] MatchScoreResolveDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _matchService.ResolveScoreAsync(id, userId, User.IsAdmin(), request, cancellationToken));
    }

    [HttpPatch("{id:long}/result")]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> RecordResult(
        long id,
        [FromBody] MatchResultDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        var updated = await _matchService.RecordResultAsync(id, userId, User.IsAdmin(), request, cancellationToken);
        return Ok(updated);
    }
}
