using System.ComponentModel.DataAnnotations;
using SportHub.API.Models;

namespace SportHub.API.DTOs;

public class LoginRequestDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Email is invalid")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequestDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Email is invalid")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 100 characters")]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Full name is required")]
    [MaxLength(100, ErrorMessage = "Full name must be at most 100 characters")]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "Phone must be at most 20 characters")]
    public string? Phone { get; set; }

    [MaxLength(255, ErrorMessage = "Address must be at most 255 characters")]
    public string? Address { get; set; }
}

public class UserProfileResponseDto
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = string.Empty;
    public int EloRating { get; set; }

    public static UserProfileResponseDto FromUser(User user)
    {
        return new UserProfileResponseDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Phone = user.Phone,
            Address = user.Address,
            Bio = user.Bio,
            AvatarUrl = user.AvatarUrl,
            Role = UserRoleExtensions.NormalizeRole(user.Role),
            EloRating = user.EloRating
        };
    }
}

public class UpdateUserProfileRequestDto
{
    [Required(ErrorMessage = "Full name is required")]
    [MaxLength(100, ErrorMessage = "Full name must be at most 100 characters")]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(20, ErrorMessage = "Phone must be at most 20 characters")]
    public string? Phone { get; set; }

    [MaxLength(255, ErrorMessage = "Address must be at most 255 characters")]
    public string? Address { get; set; }

    [MaxLength(500, ErrorMessage = "Bio must be at most 500 characters")]
    public string? Bio { get; set; }
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public UserProfileResponseDto User { get; set; } = null!;

    public AuthResponseDto()
    {
    }

    public AuthResponseDto(string token, UserProfileResponseDto user)
    {
        Token = token;
        User = user;
    }
}
