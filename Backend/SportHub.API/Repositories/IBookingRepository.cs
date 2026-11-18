using SportHub.API.Models;

namespace SportHub.API.Repositories;

public interface IBookingRepository
{
    Task<List<Booking>> GetAllOrderedAsync(CancellationToken cancellationToken = default);
    Task<Booking?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetByFieldIdAsync(long fieldId, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetPublicScheduleByFieldIdAsync(long fieldId, CancellationToken cancellationToken = default);
    Task<List<Booking>> GetByUserIdAsync(long userId, CancellationToken cancellationToken = default);
    Task<bool> HasConflictingBookingAsync(
        long fieldId,
        DateOnly bookingDate,
        TimeOnly startTime,
        TimeOnly endTime,
        long? excludeBookingId = null,
        CancellationToken cancellationToken = default);
    Task<int> ReleaseExpiredHoldsAsync(CancellationToken cancellationToken = default);
    Task<int> CompleteElapsedBookingsAsync(CancellationToken cancellationToken = default);
    Task<Booking> AddAsync(Booking booking, CancellationToken cancellationToken = default);
    Task<Booking> UpdateAsync(Booking booking, CancellationToken cancellationToken = default);
}
