using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class BookingMatchLifecycleService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BookingMatchLifecycleService> _logger;

    public BookingMatchLifecycleService(
        IServiceScopeFactory scopeFactory,
        ILogger<BookingMatchLifecycleService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = _scopeFactory.CreateAsyncScope();
                var bookingRepo = scope.ServiceProvider.GetRequiredService<IBookingRepository>();
                var matchService = scope.ServiceProvider.GetRequiredService<IMatchService>();

                var released = await bookingRepo.ReleaseExpiredHoldsAsync(stoppingToken);
                var completedOrExpired = await bookingRepo.CompleteElapsedBookingsAsync(stoppingToken);
                var autoConfirmed = await matchService.AutoConfirmElapsedScoresAsync(stoppingToken);

                if (released > 0 || completedOrExpired > 0 || autoConfirmed > 0)
                {
                    _logger.LogInformation(
                        "Lifecycle sweep: released {Released} holds, closed {Closed} bookings, auto-confirmed {Confirmed} match scores.",
                        released, completedOrExpired, autoConfirmed);
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogWarning(ex, "Lifecycle sweep encountered a transient error.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
