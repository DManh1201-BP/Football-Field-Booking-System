using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportHub.API.DTOs;
using SportHub.API.Services;

namespace SportHub.API.Controllers;

[ApiController, Route("api/owner/bookings"), Authorize(Roles = "OWNER")]
public class FieldOwnerBookingsController : ControllerBase
{
    private readonly FieldOwnerBookingService _service;
    public FieldOwnerBookingsController(FieldOwnerBookingService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<BookingResponseDto>>> GetMine(CancellationToken ct)
    {
        if (!User.TryGetUserId(out var ownerId)) return Unauthorized();
        return Ok(await _service.GetBookingsAsync(ownerId, ct));
    }

    [HttpPatch("{bookingId:long}/confirm")]
    public async Task<ActionResult<BookingResponseDto>> Confirm(long bookingId, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var ownerId)) return Unauthorized();
        return Ok(await _service.ConfirmAsync(ownerId, bookingId, ct));
    }

    [HttpPatch("{bookingId:long}/reject")]
    public async Task<ActionResult<BookingResponseDto>> Reject(long bookingId, [FromBody] BookingCancelDto request, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var ownerId)) return Unauthorized();
        return Ok(await _service.RejectAsync(ownerId, bookingId, request?.Reason, ct));
    }

    [HttpPost("walk-in")]
    public async Task<ActionResult<BookingResponseDto>> CreateWalkIn([FromBody] WalkInBookingCreateDto request, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var ownerId)) return Unauthorized();
        return StatusCode(StatusCodes.Status201Created, await _service.CreateWalkInAsync(ownerId, request, ct));
    }

    [HttpPatch("{bookingId:long}/rain-out")]
    public async Task<ActionResult<BookingResponseDto>> RainOut(long bookingId, [FromBody] RainOutDto request, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var ownerId)) return Unauthorized();
        return Ok(await _service.RainOutAsync(ownerId, bookingId, request?.Reason, ct));
    }
}
