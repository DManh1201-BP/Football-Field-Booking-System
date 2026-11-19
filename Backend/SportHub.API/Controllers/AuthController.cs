using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportHub.API.DTOs;
using SportHub.API.Services;

namespace SportHub.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _environment;
    private readonly GoogleSettings _googleSettings;

    public AuthController(IAuthService authService, IWebHostEnvironment environment, GoogleSettings googleSettings)
    {
        _authService = authService;
        _environment = environment;
        _googleSettings = googleSettings;
    }

    [HttpGet("google/config")]
    [AllowAnonymous]
    public IActionResult GoogleConfig() => Ok(new
    {
        enabled = !string.IsNullOrWhiteSpace(_googleSettings.ClientId),
        clientId = _googleSettings.ClientId
    });

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> GoogleLogin(
        [FromBody] GoogleAuthRequestDto request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_googleSettings.ClientId))
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { message = "Đăng nhập Google chưa được cấu hình trên máy chủ." });
        }

        try
        {
            var response = await _authService.LoginWithGoogleAsync(request.IdToken, cancellationToken);
            return Ok(response);
        }
        catch (GoogleAuthenticationException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Register(
        [FromBody] RegisterRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.RegisterAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken cancellationToken)
    {
        var response = await _authService.LoginAsync(request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserProfileResponseDto>> Me(CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var profile = await _authService.GetCurrentUserAsync(userId, cancellationToken);
        return Ok(profile);
    }

    [HttpPut("me/profile")]
    [Authorize]
    public async Task<ActionResult<UserProfileResponseDto>> UpdateProfile(
        [FromBody] UpdateUserProfileRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        var profile = await _authService.UpdateProfileAsync(userId, request, cancellationToken);
        return Ok(profile);
    }

    [HttpPost("me/avatar")]
    [Authorize]
    [RequestSizeLimit(2 * 1024 * 1024 + 64 * 1024)]
    public async Task<ActionResult<UserProfileResponseDto>> UploadAvatar(
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var userId))
        {
            return Unauthorized();
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "Vui lòng chọn ảnh đại diện." });
        }

        const long maxFileSize = 2 * 1024 * 1024;
        if (file.Length > maxFileSize)
        {
            return BadRequest(new { message = "Ảnh đại diện không được vượt quá 2 MB." });
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension is not (".jpg" or ".jpeg" or ".png" or ".webp"))
        {
            return BadRequest(new { message = "Chỉ chấp nhận ảnh JPG, PNG hoặc WebP." });
        }

        await using var input = file.OpenReadStream();
        var header = new byte[12];
        var bytesRead = await input.ReadAsync(header, cancellationToken);
        if (!HasAllowedImageSignature(header, bytesRead, extension))
        {
            return BadRequest(new { message = "Tệp đã chọn không phải ảnh hợp lệ." });
        }

        var uploadDirectory = Path.Combine(_environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot"), "uploads", "profiles");
        Directory.CreateDirectory(uploadDirectory);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var absolutePath = Path.Combine(uploadDirectory, fileName);
        input.Position = 0;
        await using (var output = System.IO.File.Create(absolutePath))
        {
            await input.CopyToAsync(output, cancellationToken);
        }

        try
        {
            var oldProfile = await _authService.GetCurrentUserAsync(userId, cancellationToken);
            var profile = await _authService.UpdateAvatarAsync(userId, $"/uploads/profiles/{fileName}", cancellationToken);
            DeleteStoredAvatar(oldProfile.AvatarUrl, uploadDirectory);
            return Ok(profile);
        }
        catch
        {
            System.IO.File.Delete(absolutePath);
            throw;
        }
    }

    private static bool HasAllowedImageSignature(byte[] header, int length, string extension)
    {
        if (extension is ".jpg" or ".jpeg")
        {
            return length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
        }

        if (extension == ".png")
        {
            return length >= 8 && header.Take(8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A });
        }

        return extension == ".webp" && length >= 12 &&
            header.Take(4).SequenceEqual("RIFF"u8.ToArray()) &&
            header.Skip(8).Take(4).SequenceEqual("WEBP"u8.ToArray());
    }

    private static void DeleteStoredAvatar(string? avatarUrl, string uploadDirectory)
    {
        const string prefix = "/uploads/profiles/";
        if (string.IsNullOrWhiteSpace(avatarUrl) || !avatarUrl.StartsWith(prefix, StringComparison.Ordinal))
        {
            return;
        }

        var fileName = Path.GetFileName(avatarUrl);
        var oldPath = Path.Combine(uploadDirectory, fileName);
        if (System.IO.File.Exists(oldPath))
        {
            try
            {
                System.IO.File.Delete(oldPath);
            }
            catch (IOException)
            {
                // The profile update succeeded; a stale image can be cleaned up later.
            }
        }
    }
}
