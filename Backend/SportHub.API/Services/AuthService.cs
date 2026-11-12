using SportHub.API.DTOs;
using SportHub.API.Models;
using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtService jwtService)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _userRepository.GetByEmailAsync(email, cancellationToken);
        if (existingUser is not null)
        {
            throw new ArgumentException("Email is already registered");
        }

        var user = new User
        {
            Email = email,
            Password = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            Phone = request.Phone?.Trim(),
            Address = request.Address?.Trim(),
            Role = UserRole.CUSTOMER.ToString(),
            IsActive = true
        };

        var savedUser = await _userRepository.AddAsync(user, cancellationToken);
        var token = _jwtService.GenerateToken(savedUser);
        return new AuthResponseDto(token, UserProfileResponseDto.FromUser(savedUser));
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (user is null || !user.IsActive || !_passwordHasher.Verify(request.Password, user.Password))
        {
            throw new ArgumentException("Invalid email or password");
        }

        var normalizedRole = UserRoleExtensions.NormalizeRole(user.Role);
        var requiresUpdate = false;

        if (!string.Equals(user.Role, normalizedRole, StringComparison.Ordinal))
        {
            user.Role = normalizedRole;
            requiresUpdate = true;
        }

        if (_passwordHasher.NeedsRehash(user.Password))
        {
            user.Password = _passwordHasher.HashPassword(request.Password);
            requiresUpdate = true;
        }

        if (requiresUpdate)
        {
            user = await _userRepository.UpdateAsync(user, cancellationToken);
        }

        var token = _jwtService.GenerateToken(user);
        return new AuthResponseDto(token, UserProfileResponseDto.FromUser(user));
    }

    public async Task<UserProfileResponseDto> GetCurrentUserAsync(long userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException($"User not found: {userId}");

        return UserProfileResponseDto.FromUser(user);
    }
}
