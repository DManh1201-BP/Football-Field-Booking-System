using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace SportHub.API.Services;

public sealed class GoogleSettings
{
    public string ClientId { get; set; } = string.Empty;
}

public sealed record GoogleIdentity(
    string Subject,
    string Email,
    string FullName,
    string? PictureUrl,
    string? HostedDomain,
    bool EmailVerified);

public interface IGoogleIdTokenValidator
{
    Task<GoogleIdentity?> ValidateAsync(string idToken, CancellationToken cancellationToken = default);
}

public sealed class GoogleIdTokenValidator : IGoogleIdTokenValidator
{
    private const string MetadataAddress = "https://accounts.google.com/.well-known/openid-configuration";
    private readonly GoogleSettings _settings;
    private readonly ConfigurationManager<OpenIdConnectConfiguration> _configurationManager;
    private readonly JwtSecurityTokenHandler _tokenHandler = new() { MapInboundClaims = false };

    public GoogleIdTokenValidator(GoogleSettings settings)
    {
        _settings = settings;
        _configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
            MetadataAddress,
            new OpenIdConnectConfigurationRetriever(),
            new HttpDocumentRetriever { RequireHttps = true });
    }

    public async Task<GoogleIdentity?> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ClientId) || string.IsNullOrWhiteSpace(idToken))
        {
            return null;
        }

        try
        {
            var configuration = await _configurationManager.GetConfigurationAsync(cancellationToken);
            var principal = _tokenHandler.ValidateToken(idToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuers = new[] { "https://accounts.google.com", "accounts.google.com" },
                ValidateAudience = true,
                ValidAudience = _settings.ClientId,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = configuration.SigningKeys,
                RequireSignedTokens = true,
                RequireExpirationTime = true,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(2)
            }, out var validatedToken);

            if (validatedToken is not JwtSecurityToken jwt ||
                !string.Equals(jwt.Header.Alg, SecurityAlgorithms.RsaSha256, StringComparison.Ordinal))
            {
                return null;
            }

            var subject = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            var email = principal.FindFirst("email")?.Value?.Trim().ToLowerInvariant();
            var emailVerified = bool.TryParse(principal.FindFirst("email_verified")?.Value, out var verified) && verified;
            if (string.IsNullOrWhiteSpace(subject) || subject.Length > 255 ||
                string.IsNullOrWhiteSpace(email) || email.Length > 100 || !emailVerified)
            {
                return null;
            }

            var picture = principal.FindFirst("picture")?.Value;
            if (picture?.Length > 500 ||
                !Uri.TryCreate(picture, UriKind.Absolute, out var pictureUri) ||
                pictureUri.Scheme != Uri.UriSchemeHttps)
            {
                picture = null;
            }

            return new GoogleIdentity(
                subject,
                email,
                principal.FindFirst("name")?.Value?.Trim() ?? string.Empty,
                picture,
                principal.FindFirst("hd")?.Value,
                emailVerified);
        }
        catch (SecurityTokenSignatureKeyNotFoundException)
        {
            _configurationManager.RequestRefresh();
            return null;
        }
        catch (SecurityTokenException)
        {
            return null;
        }
        catch (ArgumentException)
        {
            return null;
        }
    }
}

public sealed class GoogleAuthenticationException(string message) : Exception(message);
