using Microsoft.AspNetCore.Authorization;
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
        CancellationToken cancellationToken = default)
    {
        var leaderboard = await _matchService.GetLeaderboardAsync(limit, cancellationToken);
        return Ok(leaderboard);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> CreateMatch(
        [FromBody] MatchCreateDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var created = await _matchService.CreateMatchAsync(userId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPost("{id:long}/join")]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> JoinMatch(long id, CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var updated = await _matchService.JoinMatchAsync(id, userId, cancellationToken);
        return Ok(updated);
    }

    [HttpPatch("{id:long}/result")]
    [Authorize]
    public async Task<ActionResult<MatchResponseDto>> RecordResult(
        long id,
        [FromBody] MatchResultDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var updated = await _matchService.RecordResultAsync(id, userId, User.IsAdmin(), request, cancellationToken);
        return Ok(updated);
    }
}
