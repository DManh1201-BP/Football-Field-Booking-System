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
    private readonly IFieldService _fieldService;

    public AdminController(IAdminService adminService, IFieldService fieldService)
    {
        _adminService = adminService;
        _fieldService = fieldService;
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

    [HttpPatch("bookings/{bookingId:long}/rain-out")]
    public async Task<ActionResult<BookingResponseDto>> RainOutBooking(long bookingId, [FromBody] RainOutDto request, CancellationToken cancellationToken)
    {
        var result = await _adminService.RainOutBookingAsync(bookingId, request?.Reason, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("fields/{fieldId:long}/verify")]
    public async Task<ActionResult<FieldDto>> VerifyField(long fieldId, [FromBody] FieldVerifyDto request, CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var adminId)) return Unauthorized();
        return Ok(await _fieldService.VerifyFieldAsync(fieldId, adminId, request, cancellationToken));
    }

    [HttpGet("field-claims")]
    public async Task<ActionResult<List<FieldClaimResponseDto>>> GetFieldClaims(CancellationToken cancellationToken)
    {
        return Ok(await _fieldService.GetClaimRequestsAsync(cancellationToken));
    }

    [HttpPatch("field-claims/{claimId:long}/review")]
    public async Task<ActionResult<FieldClaimResponseDto>> ReviewFieldClaim(
        long claimId,
        [FromBody] FieldClaimReviewDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var adminId)) return Unauthorized();
        return Ok(await _fieldService.ReviewClaimAsync(claimId, adminId, request, cancellationToken));
    }

    [HttpGet("field-reports")]
    public async Task<ActionResult<List<FieldReportResponseDto>>> GetFieldReports(CancellationToken cancellationToken)
    {
        return Ok(await _fieldService.GetFieldReportsAsync(cancellationToken));
    }

    [HttpPatch("field-reports/{reportId:long}/resolve")]
    public async Task<ActionResult<FieldReportResponseDto>> ResolveFieldReport(
        long reportId,
        [FromBody] FieldReportResolveDto request,
        CancellationToken cancellationToken)
    {
        return Ok(await _fieldService.ResolveFieldReportAsync(reportId, request, cancellationToken));
    }
}
