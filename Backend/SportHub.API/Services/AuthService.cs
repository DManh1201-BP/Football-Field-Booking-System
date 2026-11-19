using SportHub.API.DTOs;
using SportHub.API.Models;
using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;
    private readonly IGoogleIdTokenValidator _googleIdTokenValidator;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtService jwtService,
        IGoogleIdTokenValidator googleIdTokenValidator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
        _googleIdTokenValidator = googleIdTokenValidator;
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

    public async Task<AuthResponseDto> LoginWithGoogleAsync(string idToken, CancellationToken cancellationToken = default)
    {
        var identity = await _googleIdTokenValidator.ValidateAsync(idToken, cancellationToken);
        if (identity is null)
        {
            throw new GoogleAuthenticationException("Google credential không hợp lệ hoặc đã hết hạn.");
        }

        var user = await _userRepository.GetByGoogleSubjectAsync(identity.Subject, cancellationToken);
        if (user is null)
        {
            user = await _userRepository.GetByEmailAsync(identity.Email, cancellationToken);
            if (user is not null)
            {
                if (!user.IsActive)
                {
                    throw new GoogleAuthenticationException("Tài khoản SportHub này hiện không hoạt động.");
                }

                if (!string.IsNullOrWhiteSpace(user.GoogleSubject) || !IsGoogleAuthoritativeForEmail(identity))
                {
                    throw new GoogleAuthenticationException(
                        "Email này đã có tài khoản. Hãy đăng nhập bằng mật khẩu hiện tại để tiếp tục.");
                }

                user.GoogleSubject = identity.Subject;
                user = await _userRepository.UpdateAsync(user, cancellationToken);
            }
            else
            {
                var fullName = string.IsNullOrWhiteSpace(identity.FullName)
                    ? identity.Email.Split('@')[0]
                    : identity.FullName;
                if (fullName.Length > 100)
                {
                    fullName = fullName[..100];
                }

                user = await _userRepository.AddAsync(new User
                {
                    Email = identity.Email,
                    Password = _passwordHasher.HashPassword(Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48))),
                    FullName = fullName,
                    AvatarUrl = identity.PictureUrl,
                    GoogleSubject = identity.Subject,
                    Role = UserRole.CUSTOMER.ToString(),
                    IsActive = true
                }, cancellationToken);
            }
        }

        if (!user.IsActive)
        {
            throw new GoogleAuthenticationException("Tài khoản SportHub này hiện không hoạt động.");
        }

        var token = _jwtService.GenerateToken(user);
        return new AuthResponseDto(token, UserProfileResponseDto.FromUser(user));
    }

    private static bool IsGoogleAuthoritativeForEmail(GoogleIdentity identity) =>
        identity.Email.EndsWith("@gmail.com", StringComparison.OrdinalIgnoreCase) ||
        !string.IsNullOrWhiteSpace(identity.HostedDomain);

    public async Task<UserProfileResponseDto> GetCurrentUserAsync(long userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException($"User not found: {userId}");

        return UserProfileResponseDto.FromUser(user);
    }

    public async Task<UserProfileResponseDto> UpdateProfileAsync(
        long userId,
        UpdateUserProfileRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException($"User not found: {userId}");

        var fullName = request.FullName.Trim();
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("Full name is required");
        }

        user.FullName = fullName;
        user.Address = NormalizeOptional(request.Address);
        user.Bio = NormalizeOptional(request.Bio);

        var savedUser = await _userRepository.UpdateAsync(user, cancellationToken);
        return UserProfileResponseDto.FromUser(savedUser);
    }

    public async Task<UserProfileResponseDto> UpdateAvatarAsync(
        long userId,
        string avatarUrl,
        CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException($"User not found: {userId}");

        user.AvatarUrl = avatarUrl;
        var savedUser = await _userRepository.UpdateAsync(user, cancellationToken);
        return UserProfileResponseDto.FromUser(savedUser);
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
