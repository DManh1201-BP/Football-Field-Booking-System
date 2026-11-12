using SportHub.API.DTOs;

namespace SportHub.API.Services;

public interface IAdminService
{
    Task<List<BookingResponseDto>> GetAllBookingsAsync(CancellationToken cancellationToken = default);
    Task<AdminRevenueSummaryResponseDto> GetRevenueSummaryAsync(CancellationToken cancellationToken = default);
    Task<BookingResponseDto> ConfirmBookingAsync(long bookingId, CancellationToken cancellationToken = default);
}
