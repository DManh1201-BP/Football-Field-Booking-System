using System.Data;
using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.DTOs;
using SportHub.API.Models;
using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class BookingService : IBookingService
{
    private const int DefaultHoldMinutes = 10;

    private readonly SportHubDbContext _dbContext;
    private readonly IBookingRepository _bookingRepository;
    private readonly IFieldRepository _fieldRepository;
    private readonly IUserRepository _userRepository;
    private readonly NotificationService _notifications;

    public BookingService(
        SportHubDbContext dbContext,
        IBookingRepository bookingRepository,
        IFieldRepository fieldRepository,
        IUserRepository userRepository,
        NotificationService notifications)
    {
        _dbContext = dbContext;
        _bookingRepository = bookingRepository;
        _fieldRepository = fieldRepository;
        _userRepository = userRepository;
        _notifications = notifications;
    }

    public async Task<List<BookingResponseDto>> GetAllBookingsAsync(CancellationToken cancellationToken = default)
    {
        await _bookingRepository.ReleaseExpiredHoldsAsync(cancellationToken);
        await _bookingRepository.CompleteElapsedBookingsAsync(cancellationToken);
        var bookings = await _bookingRepository.GetAllOrderedAsync(cancellationToken);
        return bookings.Select(BookingResponseDto.FromEntity).ToList();
    }

    public async Task<List<BookingResponseDto>> GetBookingsByFieldAsync(long fieldId, CancellationToken cancellationToken = default)
    {
        await _bookingRepository.ReleaseExpiredHoldsAsync(cancellationToken);
        await _bookingRepository.CompleteElapsedBookingsAsync(cancellationToken);
        var bookings = await _bookingRepository.GetByFieldIdAsync(fieldId, cancellationToken);
        return bookings.Select(BookingResponseDto.FromEntity).ToList();
    }

    public async Task<List<PublicBookingScheduleDto>> GetPublicScheduleByFieldAsync(long fieldId, CancellationToken cancellationToken = default)
    {
        var bookings = await _bookingRepository.GetPublicScheduleByFieldIdAsync(fieldId, cancellationToken);
        return bookings.Select(PublicBookingScheduleDto.FromEntity).ToList();
    }

    public async Task<List<BookingResponseDto>> GetBookingsByUserAsync(long userId, CancellationToken cancellationToken = default)
    {
        await _bookingRepository.ReleaseExpiredHoldsAsync(cancellationToken);
        await _bookingRepository.CompleteElapsedBookingsAsync(cancellationToken);
        var bookings = await _bookingRepository.GetByUserIdAsync(userId, cancellationToken);
        return bookings.Select(BookingResponseDto.FromEntity).ToList();
    }

    public async Task<BookingResponseDto> CreateBookingAsync(
        long authenticatedUserId,
        BookingCreateDto request,
        CancellationToken cancellationToken = default)
    {
        var fieldId = request.FieldId ?? throw new ArgumentException("Field ID is required");
        var bookingDate = request.BookingDate ?? throw new ArgumentException("Booking date is required");
        var startTime = request.StartTime ?? throw new ArgumentException("Start time is required");
        var endTime = request.EndTime ?? throw new ArgumentException("End time is required");

        if (endTime <= startTime)
        {
            throw new ArgumentException("End time must be after start time");
        }

        if (bookingDate < DateOnly.FromDateTime(DateTime.Today))
        {
            throw new ArgumentException("Booking date must be today or later");
        }
        if (bookingDate == DateOnly.FromDateTime(DateTime.Today) && endTime <= TimeOnly.FromDateTime(DateTime.Now))
        {
            throw new ArgumentException("Selected time slot has already ended");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        await _bookingRepository.ReleaseExpiredHoldsAsync(cancellationToken);

        var field = await _fieldRepository.GetByIdAsync(fieldId, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {fieldId}");

        var user = await _userRepository.GetByIdAsync(authenticatedUserId, cancellationToken)
            ?? throw new KeyNotFoundException($"User not found: {authenticatedUserId}");

        if (!field.IsAvailable)
        {
            throw new ArgumentException("Field is not available for booking");
        }

        var hasConflict = await _bookingRepository.HasConflictingBookingAsync(
            fieldId,
            bookingDate,
            startTime,
            endTime,
            excludeBookingId: null,
            cancellationToken: cancellationToken);

        if (hasConflict)
        {
            throw new ArgumentException("Selected time slot is already booked");
        }

        var totalPrice = CalculateTotalPrice(field.PricePerHour, startTime, endTime);

        var booking = new Booking
        {
            FieldId = field.Id,
            Field = field,
            UserId = user.Id,
            User = user,
            BookingDate = bookingDate,
            StartTime = startTime,
            EndTime = endTime,
            CustomerPhone = request.CustomerPhone.Trim(),
            Notes = request.Notes?.Trim(),
            Status = request.HoldOnly ? "HOLD" : "PENDING",
            HoldExpiresAt = request.HoldOnly ? DateTime.Now.AddMinutes(DefaultHoldMinutes) : null,
            TotalPrice = totalPrice
        };

        var savedBooking = await _bookingRepository.AddAsync(booking, cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return BookingResponseDto.FromEntity(savedBooking);
    }

    public async Task<BookingResponseDto> CancelBookingAsync(
        long bookingId,
        long requesterUserId,
        bool isAdmin,
        string? reason = null,
        CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new KeyNotFoundException($"Booking not found: {bookingId}");

        if (!isAdmin && booking.UserId != requesterUserId)
        {
            throw new UnauthorizedAccessException("You are not allowed to cancel this booking");
        }

        if (string.Equals(booking.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Completed booking cannot be cancelled");
        }

        booking.Status = "CANCELLED";
        booking.HoldExpiresAt = null;
        if (!string.IsNullOrWhiteSpace(reason))
        {
            booking.CancellationReason = reason.Trim();
        }

        var updated = await _bookingRepository.UpdateAsync(booking, cancellationToken);
        return BookingResponseDto.FromEntity(updated);
    }

    public async Task<BookingResponseDto> UpdateBookingAsync(
        long bookingId,
        long requesterUserId,
        bool isAdmin,
        BookingUpdateDto request,
        CancellationToken cancellationToken = default)
    {
        var booking = await _bookingRepository.GetByIdAsync(bookingId, cancellationToken)
            ?? throw new KeyNotFoundException($"Booking not found: {bookingId}");

        if (!isAdmin && booking.UserId != requesterUserId)
        {
            throw new UnauthorizedAccessException("You are not allowed to update this booking");
        }

        if (string.Equals(booking.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(booking.Status, "CANCELLED", StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Completed or cancelled booking cannot be updated");
        }

        var fieldId = request.FieldId ?? throw new ArgumentException("Field ID is required");
        var bookingDate = request.BookingDate ?? throw new ArgumentException("Booking date is required");
        var startTime = request.StartTime ?? throw new ArgumentException("Start time is required");
        var endTime = request.EndTime ?? throw new ArgumentException("End time is required");

        if (endTime <= startTime)
        {
            throw new ArgumentException("End time must be after start time");
        }

        if (bookingDate < DateOnly.FromDateTime(DateTime.Today))
        {
            throw new ArgumentException("Booking date must be today or later");
        }
        if (bookingDate == DateOnly.FromDateTime(DateTime.Today) && endTime <= TimeOnly.FromDateTime(DateTime.Now))
        {
            throw new ArgumentException("Selected time slot has already ended");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        await _bookingRepository.ReleaseExpiredHoldsAsync(cancellationToken);

        var field = await _fieldRepository.GetByIdAsync(fieldId, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {fieldId}");

        if (!field.IsAvailable)
        {
            throw new ArgumentException("Field is not available for booking");
        }

        var hasConflict = await _bookingRepository.HasConflictingBookingAsync(
            fieldId,
            bookingDate,
            startTime,
            endTime,
            booking.Id,
            cancellationToken);

        if (hasConflict)
        {
            throw new ArgumentException("Selected time slot is already booked");
        }

        var scheduleChanged = booking.FieldId != field.Id || booking.BookingDate != bookingDate ||
            booking.StartTime != startTime || booking.EndTime != endTime;
        booking.FieldId = field.Id;
        booking.Field = field;
        booking.BookingDate = bookingDate;
        booking.StartTime = startTime;
        booking.EndTime = endTime;
        booking.CustomerPhone = request.CustomerPhone.Trim();
        booking.Notes = request.Notes?.Trim();
        booking.TotalPrice = CalculateTotalPrice(field.PricePerHour, startTime, endTime);
        booking.UpdatedAt = DateTime.Now;

        var updated = await _bookingRepository.UpdateAsync(booking, cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        if (scheduleChanged)
            await _notifications.CreateAsync(booking.UserId, booking.Id,
                $"Booking #{booking.Id} đã được thay đổi sang {bookingDate:dd/MM/yyyy}, {startTime:HH:mm}-{endTime:HH:mm}.", cancellationToken);

        return BookingResponseDto.FromEntity(updated);
    }

    private static decimal CalculateTotalPrice(decimal pricePerHour, TimeOnly startTime, TimeOnly endTime)
    {
        var durationMinutes = (decimal)(endTime.ToTimeSpan() - startTime.ToTimeSpan()).TotalMinutes;
        var hours = Math.Round(durationMinutes / 60m, 2, MidpointRounding.AwayFromZero);
        return Math.Round(pricePerHour * hours, 2, MidpointRounding.AwayFromZero);
    }
}
