using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.Models;

namespace SportHub.API.Repositories;

public class BookingRepository : IBookingRepository
{
    private readonly SportHubDbContext _dbContext;

    public BookingRepository(SportHubDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Booking>> GetAllOrderedAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Bookings
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.Field)
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<Booking?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Bookings
            .Include(b => b.User)
            .Include(b => b.Field)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<List<Booking>> GetByFieldIdAsync(long fieldId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Bookings
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.Field)
            .Where(b => b.FieldId == fieldId)
            .OrderBy(b => b.BookingDate)
            .ThenBy(b => b.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Booking>> GetPublicScheduleByFieldIdAsync(long fieldId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.Now;
        return await _dbContext.Bookings
            .AsNoTracking()
            .Where(b => b.FieldId == fieldId &&
                b.Status != "CANCELLED" &&
                (b.Status != "HOLD" || (b.HoldExpiresAt != null && b.HoldExpiresAt > now)))
            .OrderBy(b => b.BookingDate)
            .ThenBy(b => b.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Booking>> GetByUserIdAsync(long userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Bookings
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.Field)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .ThenByDescending(b => b.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasConflictingBookingAsync(
        long fieldId,
        DateOnly bookingDate,
        TimeOnly startTime,
        TimeOnly endTime,
        long? excludeBookingId = null,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.Now;
        var query = _dbContext.Bookings.Where(b =>
            b.FieldId == fieldId &&
            b.BookingDate == bookingDate &&
            b.Status != "CANCELLED" &&
            (b.Status != "HOLD" || (b.HoldExpiresAt != null && b.HoldExpiresAt > now)) &&
            b.StartTime < endTime &&
            b.EndTime > startTime);

        if (excludeBookingId.HasValue)
        {
            query = query.Where(b => b.Id != excludeBookingId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<int> ReleaseExpiredHoldsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.Now;
        var expiredHolds = await _dbContext.Bookings
            .Where(b => b.Status == "HOLD" && b.HoldExpiresAt != null && b.HoldExpiresAt <= now)
            .ToListAsync(cancellationToken);

        if (expiredHolds.Count == 0)
        {
            return 0;
        }

        foreach (var hold in expiredHolds)
        {
            hold.Status = "CANCELLED";
        }

        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Booking> AddAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        _dbContext.Bookings.Add(booking);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return booking;
    }

    public async Task<Booking> UpdateAsync(Booking booking, CancellationToken cancellationToken = default)
    {
        _dbContext.Bookings.Update(booking);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return booking;
    }
}
