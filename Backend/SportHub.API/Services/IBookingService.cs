using SportHub.API.DTOs;

namespace SportHub.API.Services;

public interface IBookingService
{
    Task<List<BookingResponseDto>> GetAllBookingsAsync(CancellationToken cancellationToken = default);
    Task<List<BookingResponseDto>> GetBookingsByFieldAsync(long fieldId, CancellationToken cancellationToken = default);
    Task<List<BookingResponseDto>> GetBookingsByUserAsync(long userId, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> CreateBookingAsync(long authenticatedUserId, BookingCreateDto request, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> UpdateBookingAsync(long bookingId, long requesterUserId, bool isAdmin, BookingUpdateDto request, CancellationToken cancellationToken = default);
    Task<BookingResponseDto> CancelBookingAsync(long bookingId, long requesterUserId, bool isAdmin, string? reason = null, CancellationToken cancellationToken = default);
}
