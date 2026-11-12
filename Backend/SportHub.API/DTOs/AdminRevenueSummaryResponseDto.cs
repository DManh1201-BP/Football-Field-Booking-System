namespace SportHub.API.DTOs;

public class AdminRevenueSummaryResponseDto
{
    public long TotalBookings { get; set; }
    public long PendingBookings { get; set; }
    public long ConfirmedBookings { get; set; }
    public decimal TotalRevenue { get; set; }
}
