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

    public async Task NotifyAdminsAsync(string category, long? referenceId, string message, CancellationToken ct = default)
    {
        var adminIds = await _db.Users.AsNoTracking()
            .Where(u => u.IsActive && u.Role == "ADMIN")
            .Select(u => u.Id)
            .ToListAsync(ct);
        if (adminIds.Count == 0) return;

        var trimmed = message.Length > 500 ? message[..500] : message;
        _db.Notifications.AddRange(adminIds.Select(adminId => new Notification
        {
            UserId = adminId,
            Category = category,
            ReferenceId = referenceId,
            Message = trimmed
        }));
        await _db.SaveChangesAsync(ct);
    }

    public async Task NotifyBookingMatchParticipantsAsync(long bookingId, string message, CancellationToken ct = default)
    {
        var matches = await _db.Matches
            .Include(m => m.Participants)
            .Where(m => m.BookingId == bookingId && m.Status != "COMPLETED" && m.Status != "CANCELLED")
            .ToListAsync(ct);
        if (matches.Count == 0) return;

        var recipientIds = new HashSet<long>();
        foreach (var match in matches)
        {
            recipientIds.Add(match.HostUserId);
            if (match.ChallengerUserId.HasValue) recipientIds.Add(match.ChallengerUserId.Value);
            foreach (var p in match.Participants.Where(p => p.Status is "JOINED" or "CHECKED_IN" or "WAITLISTED"))
            {
                recipientIds.Add(p.UserId);
            }
        }
        if (recipientIds.Count == 0) return;

        var trimmed = message.Length > 500 ? message[..500] : message;
        _db.Notifications.AddRange(recipientIds.Select(uid => new Notification
        {
            UserId = uid,
            BookingId = bookingId,
            Category = "MATCH",
            ReferenceId = matches[0].Id,
            Message = trimmed
        }));
        await _db.SaveChangesAsync(ct);
    }
}
