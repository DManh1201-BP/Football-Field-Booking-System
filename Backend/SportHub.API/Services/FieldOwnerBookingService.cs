using System.Data;
using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.DTOs;
using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class FieldOwnerBookingService
{
    private readonly SportHubDbContext _db;
    private readonly IBookingRepository _bookings;
    private readonly NotificationService _notifications;

    public FieldOwnerBookingService(SportHubDbContext db, IBookingRepository bookings, NotificationService notifications)
    {
        _db = db;
        _bookings = bookings;
        _notifications = notifications;
    }

    public async Task<List<BookingResponseDto>> GetBookingsAsync(long ownerId, CancellationToken ct = default)
    {
        await _bookings.ReleaseExpiredHoldsAsync(ct);
        await _bookings.CompleteElapsedBookingsAsync(ct);
        var items = await _db.Bookings.AsNoTracking().Include(b => b.User).Include(b => b.Field)
            .Where(b => b.Field.OwnerId == ownerId)
            .OrderByDescending(b => b.BookingDate).ThenByDescending(b => b.StartTime).ToListAsync(ct);
        return items.Select(BookingResponseDto.FromEntity).ToList();
    }

    public Task<BookingResponseDto> ConfirmAsync(long ownerId, long bookingId, CancellationToken ct = default) =>
        SetDecisionAsync(ownerId, bookingId, true, null, ct);

    public Task<BookingResponseDto> RejectAsync(long ownerId, long bookingId, string? reason, CancellationToken ct = default) =>
        SetDecisionAsync(ownerId, bookingId, false, reason, ct);

    private async Task<BookingResponseDto> SetDecisionAsync(long ownerId, long bookingId, bool approve, string? reason, CancellationToken ct)
    {
        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        var booking = await _bookings.GetByIdAsync(bookingId, ct)
            ?? throw new KeyNotFoundException($"Booking not found: {bookingId}");
        if (booking.Field.OwnerId != ownerId)
            throw new UnauthorizedAccessException("You can only manage bookings for fields you own");
        if (booking.Status is not ("PENDING" or "HOLD"))
            throw new ArgumentException("Only pending or held bookings can be decided");

        string message;
        if (approve)
        {
            if (await _bookings.HasConflictingBookingAsync(booking.FieldId, booking.BookingDate, booking.StartTime, booking.EndTime,
                    booking.Id, ct))
                throw new ArgumentException("Another active booking overlaps this slot");
            booking.Status = "CONFIRMED";
            message = $"Booking #{booking.Id} tại {booking.Field.Name} đã được chủ sân xác nhận.";
        }
        else
        {
            booking.Status = "CANCELLED";
            booking.CancellationReason = string.IsNullOrWhiteSpace(reason) ? "Bị từ chối bởi chủ sân" : reason.Trim();
            message = $"Booking #{booking.Id} tại {booking.Field.Name} bị chủ sân từ chối. Lý do: {booking.CancellationReason}";
        }
        booking.HoldExpiresAt = null;
        var updated = await _bookings.UpdateAsync(booking, ct);
        await transaction.CommitAsync(ct);
        await _notifications.CreateAsync(booking.UserId, booking.Id, message, ct);
        return BookingResponseDto.FromEntity(updated);
    }
}
