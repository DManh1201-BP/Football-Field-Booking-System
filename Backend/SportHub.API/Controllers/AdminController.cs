using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportHub.API.DTOs;
using SportHub.API.Services;

namespace SportHub.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpGet("bookings")]
    public async Task<ActionResult<List<BookingResponseDto>>> GetAllBookings(CancellationToken cancellationToken)
    {
        var bookings = await _adminService.GetAllBookingsAsync(cancellationToken);
        return Ok(bookings);
    }

    [HttpGet("revenue/summary")]
    public async Task<ActionResult<AdminRevenueSummaryResponseDto>> GetRevenueSummary(CancellationToken cancellationToken)
    {
        var summary = await _adminService.GetRevenueSummaryAsync(cancellationToken);
        return Ok(summary);
    }

    [HttpPatch("bookings/{bookingId:long}/confirm")]
    public async Task<ActionResult<BookingResponseDto>> ConfirmBooking(
        long bookingId,
        CancellationToken cancellationToken)
    {
        var confirmed = await _adminService.ConfirmBookingAsync(bookingId, cancellationToken);
        return Ok(confirmed);
    }

    [HttpPatch("bookings/{bookingId:long}/reject")]
    public async Task<ActionResult<BookingResponseDto>> RejectBooking(long bookingId, [FromBody] BookingCancelDto request, CancellationToken cancellationToken)
    {
        var rejected = await _adminService.RejectBookingAsync(bookingId, request?.Reason, cancellationToken);
        return Ok(rejected);
    }
}
