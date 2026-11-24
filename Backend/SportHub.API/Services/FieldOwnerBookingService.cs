using System.Data;
using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.DTOs;
using SportHub.API.Models;
using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class FieldOwnerBookingService
{
    private readonly SportHubDbContext _db;
    private readonly IBookingRepository _bookings;
    private readonly IFieldRepository _fields;
    private readonly IUserRepository _users;
    private readonly NotificationService _notifications;

    public FieldOwnerBookingService(
        SportHubDbContext db,
        IBookingRepository bookings,
        IFieldRepository fields,
        IUserRepository users,
        NotificationService notifications)
    {
        _db = db;
        _bookings = bookings;
        _fields = fields;
        _users = users;
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

    public async Task<BookingResponseDto> CreateWalkInAsync(long ownerId, WalkInBookingCreateDto request, CancellationToken ct = default)
    {
        var fieldId = request.FieldId ?? throw new ArgumentException("Field ID is required");
        var bookingDate = request.BookingDate ?? throw new ArgumentException("Booking date is required");
        var startTime = request.StartTime ?? throw new ArgumentException("Start time is required");
        var endTime = request.EndTime ?? throw new ArgumentException("End time is required");

        if (endTime <= startTime) throw new ArgumentException("End time must be after start time");

        await using var transaction = await _db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        await _bookings.ReleaseExpiredHoldsAsync(ct);

        var field = await _fields.GetByIdAsync(fieldId, ct)
            ?? throw new KeyNotFoundException($"Field not found: {fieldId}");
        if (field.OwnerId != ownerId)
            throw new UnauthorizedAccessException("Bạn chỉ có thể khóa lịch vãng lai cho sân thuộc quyền sở hữu của mình.");

        var owner = await _users.GetByIdAsync(ownerId, ct)
            ?? throw new KeyNotFoundException($"User not found: {ownerId}");

        if (await _bookings.HasConflictingBookingAsync(fieldId, bookingDate, startTime, endTime, null, ct))
            throw new ArgumentException("Khung giờ này đã có lịch đặt trùng.");

        var durationMinutes = (decimal)(endTime.ToTimeSpan() - startTime.ToTimeSpan()).TotalMinutes;
        var hours = Math.Round(durationMinutes / 60m, 2, MidpointRounding.AwayFromZero);
        var totalPrice = Math.Round(field.PricePerHour * hours, 2, MidpointRounding.AwayFromZero);

        var notesParts = new List<string> { $"[Khách tại sân / Zalo] {request.CustomerName.Trim()}" };
        if (!string.IsNullOrWhiteSpace(request.Notes)) notesParts.Add(request.Notes.Trim());

        var booking = new Booking
        {
            FieldId = field.Id,
            Field = field,
            UserId = owner.Id,
            User = owner,
            BookingDate = bookingDate,
            StartTime = startTime,
            EndTime = endTime,
            CustomerPhone = string.IsNullOrWhiteSpace(request.CustomerPhone) ? owner.Phone : request.CustomerPhone.Trim(),
            Notes = string.Join(" — ", notesParts),
            Status = "CONFIRMED",
            BookingType = "WALK_IN",
            ExpectedPlayers = request.ExpectedPlayers,
            TotalPrice = totalPrice,
            PaymentStatus = "UNPAID"
        };

        var saved = await _bookings.AddAsync(booking, ct);
        await transaction.CommitAsync(ct);
        return BookingResponseDto.FromEntity(saved);
    }

    public async Task<BookingResponseDto> RainOutAsync(long ownerId, long bookingId, string? reason, CancellationToken ct = default)
    {
        var booking = await _bookings.GetByIdAsync(bookingId, ct)
            ?? throw new KeyNotFoundException($"Booking not found: {bookingId}");
        if (booking.Field.OwnerId != ownerId)
            throw new UnauthorizedAccessException("You can only manage bookings for fields you own");
        if (booking.Field.IsIndoor)
            throw new ArgumentException("Sân trong nhà không áp dụng trạng thái hoãn mưa (RAIN_OUT).");
        if (booking.Status is not ("PENDING" or "HOLD" or "CONFIRMED"))
            throw new ArgumentException("Only active bookings can be marked as RAIN_OUT");

        booking.Status = "RAIN_OUT";
        booking.HoldExpiresAt = null;
        booking.CancellationReason = string.IsNullOrWhiteSpace(reason) ? "Hoãn do trời mưa / thời tiết xấu" : reason.Trim();
        booking.CancellationPolicyApplied = "Bất khả kháng (RAIN_OUT): Miễn phạt, hoàn cọc 100%";
        if (booking.PaymentStatus is "DEPOSIT_PAID" or "PAID")
            booking.PaymentStatus = "REFUNDED";

        var updated = await _bookings.UpdateAsync(booking, ct);
        await _notifications.CreateAsync(booking.UserId, booking.Id,
            $"Booking #{booking.Id} tại {booking.Field.Name} được chủ sân hoãn do thời tiết ({booking.CancellationReason}) và hoàn cọc.", ct);
        await _notifications.NotifyBookingMatchParticipantsAsync(booking.Id,
            $"Trận đấu tại {booking.Field.Name} được hoãn do thời tiết ({booking.CancellationReason}).", ct);
        return BookingResponseDto.FromEntity(updated);
    }

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
        if (!approve)
        {
            await _notifications.NotifyBookingMatchParticipantsAsync(booking.Id,
                $"Booking #{booking.Id} tại {booking.Field.Name} đã bị chủ sân từ chối.", ct);
        }
        return BookingResponseDto.FromEntity(updated);
    }
}
