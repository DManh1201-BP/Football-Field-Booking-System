using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using SportHub.API.Models;

namespace SportHub.API.Services;

public class JwtService : IJwtService
{
    private readonly JwtSettings _settings;
    private readonly SymmetricSecurityKey _signingKey;

    public JwtService(JwtSettings settings)
    {
        _settings = settings;
        _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
    }

    public string GenerateToken(User user)
    {
        var normalizedRole = UserRoleExtensions.NormalizeRole(user.Role);
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(_settings.ExpirationMinutes > 0 ? _settings.ExpirationMinutes : 1440);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, normalizedRole),
            new("role", normalizedRole),
            new("userId", user.Id.ToString())
        };

        var credentials = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
