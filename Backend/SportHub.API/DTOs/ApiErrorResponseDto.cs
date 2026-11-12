namespace SportHub.API.DTOs;

public class ApiErrorResponseDto
{
    public DateTime Timestamp { get; set; } = DateTime.Now;
    public int Status { get; set; }
    public string Error { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;

    public ApiErrorResponseDto()
    {
    }

    public ApiErrorResponseDto(DateTime timestamp, int status, string error, string message, string path)
    {
        Timestamp = timestamp;
        Status = status;
        Error = error;
        Message = message;
        Path = path;
    }
}
