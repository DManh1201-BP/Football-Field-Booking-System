using System.Data;
using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.DTOs;
using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class AdminService : IAdminService
{
    private readonly SportHubDbContext _dbContext;
    private readonly IBookingRepository _bookingRepository;
    private readonly NotificationService _notifications;

    public AdminService(SportHubDbContext dbContext, IBookingRepository bookingRepository, NotificationService notifications)
    {
        _dbContext = dbContext;
        _bookingRepository = bookingRepository;
        _notifications = notifications;
    }

    public async Task<List<BookingResponseDto>> GetAllBookingsAsync(CancellationToken cancellationToken = default)
    {
        await _bookingRepository.ReleaseExpiredHoldsAsync(cancellationToken);
        await _bookingRepository.CompleteElapsedBookingsAsync(cancellationToken);
        var bookings = await _bookingRepository.GetAllOrderedAsync(cancellationToken);
        return bookings.Select(BookingResponseDto.FromEntity).ToList();
    }

    public async Task<AdminRevenueSummaryResponseDto> GetRevenueSummaryAsync(CancellationToken cancellationToken = default)
    {
        await _bookingRepository.ReleaseExpiredHoldsAsync(cancellationToken);
        await _bookingRepository.CompleteElapsedBookingsAsync(cancellationToken);
        var bookings = await _bookingRepository.GetAllOrderedAsync(cancellationToken);

        decimal totalRevenue = 0m;
        long pending = 0;
        long confirmed = 0;

        foreach (var booking in bookings)
        {
            if (string.Equals(booking.Status, "PENDING", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(booking.Status, "HOLD", StringComparison.OrdinalIgnoreCase))
            {
                pending++;
            }
            else if (string.Equals(booking.Status, "CONFIRMED", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(booking.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            {
                confirmed++;
                totalRevenue += booking.TotalPrice;
            }
        }

        return new AdminRevenueSummaryResponseDto
        {
            TotalBookings = bookings.Count,
            PendingBookings = pending,
            ConfirmedBookings = confirmed,
            TotalRevenue = totalRevenue
        };
    }

    public async Task<BookingResponseDto> ConfirmBookingAsync(long bookingId, CancellationToken cancellationToken = default)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new KeyNotFoundException($"Booking not found: {bookingId}");

        if (string.Equals(booking.Status, "CANCELLED", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Cancelled booking cannot be confirmed");
        }

        var hasConflict = await _bookingRepository.HasConflictingBookingAsync(
            booking.FieldId,
            booking.BookingDate,
            booking.StartTime,
            booking.EndTime,
            excludeBookingId: booking.Id,
            cancellationToken: cancellationToken);

        if (hasConflict)
        {
            throw new ArgumentException("Cannot confirm booking because another active booking overlaps this slot");
        }

        booking.Status = "CONFIRMED";
        booking.HoldExpiresAt = null;

        var updated = await _bookingRepository.UpdateAsync(booking, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        await _notifications.CreateAsync(booking.UserId, booking.Id, $"Booking #{booking.Id} đã được admin xác nhận.", cancellationToken);

        return BookingResponseDto.FromEntity(updated);
    }

    public async Task<BookingResponseDto> RejectBookingAsync(long bookingId, string? reason, CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new KeyNotFoundException($"Booking not found: {bookingId}");
        if (booking.Status is not ("PENDING" or "HOLD"))
            throw new ArgumentException("Only pending or held bookings can be rejected");
        booking.Status = "CANCELLED";
        booking.HoldExpiresAt = null;
        booking.CancellationReason = string.IsNullOrWhiteSpace(reason) ? "Bị từ chối bởi quản trị viên" : reason.Trim();
        var updated = await _bookingRepository.UpdateAsync(booking, cancellationToken);
        await _notifications.CreateAsync(booking.UserId, booking.Id,
            $"Booking #{booking.Id} bị từ chối. Lý do: {booking.CancellationReason}", cancellationToken);
        await _notifications.NotifyBookingMatchParticipantsAsync(booking.Id,
            $"Booking #{booking.Id} cho trận đấu đã bị từ chối: {booking.CancellationReason}", cancellationToken);
        return BookingResponseDto.FromEntity(updated);
    }

    public async Task<BookingResponseDto> RainOutBookingAsync(long bookingId, string? reason, CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new KeyNotFoundException($"Booking not found: {bookingId}");

        if (booking.Status is not ("PENDING" or "HOLD" or "CONFIRMED"))
        {
            throw new ArgumentException("Only active bookings can be marked as RAIN_OUT");
        }

        booking.Status = "RAIN_OUT";
        booking.HoldExpiresAt = null;
        booking.CancellationReason = string.IsNullOrWhiteSpace(reason) ? "Hoãn do thời tiết / sự cố bất khả kháng" : reason.Trim();
        booking.CancellationPolicyApplied = "Bất khả kháng (RAIN_OUT): Miễn phạt, hoàn cọc 100%";
        if (booking.PaymentStatus is "DEPOSIT_PAID" or "PAID")
        {
            booking.PaymentStatus = "REFUNDED";
        }

        var updated = await _bookingRepository.UpdateAsync(booking, cancellationToken);
        await _notifications.CreateAsync(booking.UserId, booking.Id,
            $"Booking #{booking.Id} tại {booking.Field.Name} được hoãn bất khả kháng ({booking.CancellationReason}) và hoàn cọc 100%.",
            cancellationToken);
        await _notifications.NotifyBookingMatchParticipantsAsync(booking.Id,
            $"Trận đấu tại {booking.Field.Name} được hoãn do thời tiết/sự cố ({booking.CancellationReason}).",
            cancellationToken);
        return BookingResponseDto.FromEntity(updated);
    }
}
