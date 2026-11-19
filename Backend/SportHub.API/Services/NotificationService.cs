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
        _db.Notifications.Add(new Notification { UserId = userId, BookingId = bookingId, Category = "BOOKING", Message = message });
        await _db.SaveChangesAsync(ct);
    }

    public async Task CreateEventAsync(long userId, string category, long? referenceId, string message, CancellationToken ct = default)
    {
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            Category = category,
            ReferenceId = referenceId,
            Message = message
        });
        await _db.SaveChangesAsync(ct);
    }

    public Task<List<Notification>> GetForUserAsync(long userId, CancellationToken ct = default) =>
        _db.Notifications.AsNoTracking().Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync(ct);

    public Task<int> GetUnreadCountAsync(long userId, CancellationToken ct = default) =>
        _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);

    public async Task<int> CreateAnnouncementAsync(string message, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(message)) throw new ArgumentException("Nội dung thông báo không được để trống.");
        var recipients = await _db.Users.AsNoTracking()
            .Where(user => user.IsActive && user.Role != "ADMIN")
            .Select(user => user.Id).ToListAsync(ct);
        _db.Notifications.AddRange(recipients.Select(userId => new Notification
        {
            UserId = userId,
            Category = "SYSTEM",
            Message = message.Trim()
        }));
        await _db.SaveChangesAsync(ct);
        return recipients.Count;
    }

    public async Task<int> SendFeedbackAsync(long senderId, string senderName, string message, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(message)) throw new ArgumentException("Nội dung góp ý không được để trống.");
        var admins = await _db.Users.AsNoTracking()
            .Where(user => user.IsActive && user.Role == "ADMIN")
            .Select(user => user.Id).ToListAsync(ct);
        if (admins.Count == 0) throw new ArgumentException("Hiện chưa có tài khoản admin để nhận góp ý.");

        var body = $"Góp ý từ {senderName}: {message.Trim()}";
        if (body.Length > 500) body = body[..500];
        _db.Notifications.AddRange(admins.Select(adminId => new Notification
        {
            UserId = adminId,
            Category = "FEEDBACK",
            ReferenceId = senderId,
            Message = body
        }));
        await _db.SaveChangesAsync(ct);
        return admins.Count;
    }

    public async Task<bool> MarkReadAsync(long userId, long id, CancellationToken ct = default)
    {
        var item = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId, ct);
        if (item is null) return false;
        item.IsRead = true;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
