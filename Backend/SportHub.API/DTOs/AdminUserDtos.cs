using System.ComponentModel.DataAnnotations;
using SportHub.API.Models;

namespace SportHub.API.DTOs;

public class AdminUserResponseDto
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }

    public static AdminUserResponseDto FromUser(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName,
        Phone = user.Phone,
        Role = UserRoleExtensions.NormalizeRole(user.Role),
        IsActive = user.IsActive
    };
}

public class AdminUserRoleUpdateDto
{
    [Required, MaxLength(20)]
    public string Role { get; set; } = string.Empty;
}
