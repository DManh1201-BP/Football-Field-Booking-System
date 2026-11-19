using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportHub.API.DTOs;
using SportHub.API.Services;

namespace SportHub.API.Controllers;

[ApiController, Route("api/notifications"), Authorize]
public class NotificationsController : ControllerBase
{
    private readonly NotificationService _notifications;
    public NotificationsController(NotificationService notifications) => _notifications = notifications;

    [HttpGet("me")]
    public async Task<IActionResult> Mine(CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        var items = await _notifications.GetForUserAsync(userId, ct);
        return Ok(items.Select(n => new { n.Id, n.BookingId, n.Category, n.ReferenceId, n.Message, n.IsRead, n.CreatedAt }));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return Ok(new { count = await _notifications.GetUnreadCountAsync(userId, ct) });
    }

    [HttpPost("announcements")]
    public async Task<IActionResult> Announce([FromBody] NotificationMessageRequestDto request, CancellationToken ct)
    {
        if (!User.IsInRole("ADMIN")) return Forbid();
        var count = await _notifications.CreateAnnouncementAsync(request.Message, ct);
        return Ok(new { recipients = count });
    }

    [HttpPost("feedback")]
    public async Task<IActionResult> Feedback([FromBody] NotificationMessageRequestDto request, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        if (User.IsInRole("ADMIN")) return BadRequest(new { message = "Admin không thể gửi góp ý cho chính mình." });
        var senderName = User.Identity?.Name ?? "Người dùng SportHub";
        var count = await _notifications.SendFeedbackAsync(userId, senderName, request.Message, ct);
        return Ok(new { adminsNotified = count });
    }

    [HttpPatch("{id:long}/read")]
    public async Task<IActionResult> MarkRead(long id, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return await _notifications.MarkReadAsync(userId, id, ct) ? NoContent() : NotFound();
    }
}
