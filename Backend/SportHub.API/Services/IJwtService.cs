using SportHub.API.Models;

namespace SportHub.API.Services;

public class JwtSettings
{
    public string Issuer { get; set; } = "SportHub.API";
    public string Audience { get; set; } = "SportHub.Client";
    public string Key { get; set; } = string.Empty;
    public int ExpirationMinutes { get; set; } = 1440;
}

public interface IJwtService
{
    string GenerateToken(User user);
}
