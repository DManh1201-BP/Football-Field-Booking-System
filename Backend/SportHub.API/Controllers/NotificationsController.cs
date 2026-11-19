using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        return Ok(items.Select(n => new { n.Id, n.BookingId, n.Message, n.IsRead, n.CreatedAt }));
    }

    [HttpPatch("{id:long}/read")]
    public async Task<IActionResult> MarkRead(long id, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var userId)) return Unauthorized();
        return await _notifications.MarkReadAsync(userId, id, ct) ? NoContent() : NotFound();
    }
}
