using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportHub.API.DTOs;
using SportHub.API.Services;

namespace SportHub.API.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    [HttpGet]
    [Authorize(Roles = "ADMIN")]
    public async Task<ActionResult<List<BookingResponseDto>>> GetBookings(
        [FromQuery] long? fieldId,
        [FromQuery] long? userId,
        CancellationToken cancellationToken)
    {
        if (fieldId.HasValue)
        {
            return Ok(await _bookingService.GetBookingsByFieldAsync(fieldId.Value, cancellationToken));
        }

        if (userId.HasValue)
        {
            return Ok(await _bookingService.GetBookingsByUserAsync(userId.Value, cancellationToken));
        }

        return Ok(await _bookingService.GetAllBookingsAsync(cancellationToken));
    }

    [HttpGet("field/{fieldId:long}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<PublicBookingScheduleDto>>> GetBookingsByField(
        long fieldId,
        CancellationToken cancellationToken)
    {
        var bookings = await _bookingService.GetPublicScheduleByFieldAsync(fieldId, cancellationToken);
        return Ok(bookings);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<List<BookingResponseDto>>> GetMyBookings(CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var bookings = await _bookingService.GetBookingsByUserAsync(userId, cancellationToken);
        return Ok(bookings);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<BookingResponseDto>> CreateBooking(
        [FromBody] BookingCreateDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var createdBooking = await _bookingService.CreateBookingAsync(userId, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, createdBooking);
    }

    [HttpPut("{bookingId:long}")]
    [Authorize]
    public async Task<ActionResult<BookingResponseDto>> UpdateBooking(
        long bookingId,
        [FromBody] BookingUpdateDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var updatedBooking = await _bookingService.UpdateBookingAsync(
            bookingId,
            userId,
            User.IsAdmin(),
            request,
            cancellationToken);

        return Ok(updatedBooking);
    }

    [HttpPatch("{bookingId:long}/cancel")]
    [Authorize]
    public async Task<ActionResult<BookingResponseDto>> CancelBooking(
        long bookingId,
        [FromBody] BookingCancelDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var cancelled = await _bookingService.CancelBookingAsync(
            bookingId,
            userId,
            User.IsAdmin(),
            request?.Reason?.Trim(),
            cancellationToken);

        return Ok(cancelled);
    }

    [HttpPatch("{bookingId:long}/check-in")]
    [Authorize]
    public async Task<ActionResult<BookingResponseDto>> CheckInBooking(
        long bookingId,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        return Ok(await _bookingService.CheckInBookingAsync(bookingId, userId, User.IsAdmin(), cancellationToken));
    }
}
