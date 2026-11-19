using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportHub.API.DTOs;
using SportHub.API.Services;

namespace SportHub.API.Controllers;

[ApiController]
[Route("api/social")]
[Authorize]
public class SocialController : ControllerBase
{
    private readonly SocialService _social;
    public SocialController(SocialService social) => _social = social;

    [HttpGet("requests")]
    public async Task<ActionResult<List<FriendRequestDto>>> GetRequests(CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _social.GetRequestsAsync(userId, ct));
    }

    [HttpPost("requests/{targetUserId:long}")]
    public async Task<ActionResult<FriendRequestDto>> SendRequest(long targetUserId, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _social.SendRequestAsync(userId, targetUserId, ct));
    }

    [HttpPatch("requests/{requestId:long}/accept")]
    public async Task<IActionResult> AcceptRequest(long requestId, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        await _social.RespondToRequestAsync(userId, requestId, true, ct);
        return NoContent();
    }

    [HttpPatch("requests/{requestId:long}/reject")]
    public async Task<IActionResult> RejectRequest(long requestId, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        await _social.RespondToRequestAsync(userId, requestId, false, ct);
        return NoContent();
    }

    [HttpGet("friends")]
    public async Task<ActionResult<List<SocialFriendDto>>> GetFriends(CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _social.GetFriendsAsync(userId, ct));
    }

    [HttpDelete("friends/{otherUserId:long}")]
    public async Task<IActionResult> RemoveFriend(long otherUserId, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        await _social.RemoveFriendAsync(userId, otherUserId, ct);
        return NoContent();
    }

    [HttpGet("conversations/{otherUserId:long}/messages")]
    public async Task<ActionResult<List<ChatMessageDto>>> GetMessages(long otherUserId, [FromQuery] long afterId = 0, CancellationToken ct = default)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _social.GetMessagesAsync(userId, otherUserId, Math.Max(0, afterId), ct));
    }

    [HttpPost("conversations/{otherUserId:long}/messages")]
    public async Task<ActionResult<ChatMessageDto>> SendMessage(long otherUserId, [FromBody] SendChatMessageDto request, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(await _social.SendMessageAsync(userId, otherUserId, request.Content, ct));
    }
}
