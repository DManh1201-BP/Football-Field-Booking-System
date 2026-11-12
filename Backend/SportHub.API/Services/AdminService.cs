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

    public AdminService(SportHubDbContext dbContext, IBookingRepository bookingRepository)
    {
        _dbContext = dbContext;
        _bookingRepository = bookingRepository;
    }

    public async Task<List<BookingResponseDto>> GetAllBookingsAsync(CancellationToken cancellationToken = default)
    {
        await _bookingRepository.ReleaseExpiredHoldsAsync(cancellationToken);
        var bookings = await _bookingRepository.GetAllOrderedAsync(cancellationToken);
        return bookings.Select(BookingResponseDto.FromEntity).ToList();
    }

    public async Task<AdminRevenueSummaryResponseDto> GetRevenueSummaryAsync(CancellationToken cancellationToken = default)
    {
        await _bookingRepository.ReleaseExpiredHoldsAsync(cancellationToken);
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

        return BookingResponseDto.FromEntity(updated);
    }
}
