using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.Models;

namespace SportHub.API.Services;

public class NotificationService
{
    private readonly SportHubDbContext _db;
    public NotificationService(SportHubDbContext db) => _db = db;

    public async Task CreateAsync(long userId, long bookingId, string message, CancellationToken ct = default)
    {
        _db.Notifications.Add(new Notification { UserId = userId, BookingId = bookingId, Message = message });
        await _db.SaveChangesAsync(ct);
    }

    public Task<List<Notification>> GetForUserAsync(long userId, CancellationToken ct = default) =>
        _db.Notifications.AsNoTracking().Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync(ct);

    public async Task<bool> MarkReadAsync(long userId, long id, CancellationToken ct = default)
    {
        var item = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct);
        if (item is null) return false;
        item.IsRead = true;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
