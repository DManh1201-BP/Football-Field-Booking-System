using SportHub.API.DTOs;

namespace SportHub.API.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<UserProfileResponseDto> GetCurrentUserAsync(long userId, CancellationToken cancellationToken = default);
}
