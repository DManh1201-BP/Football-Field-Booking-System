using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportHub.API.DTOs;
using SportHub.API.Services;

namespace SportHub.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UserProfilesController : ControllerBase
{
    private readonly SocialService _social;
    public UserProfilesController(SocialService social) => _social = social;

    [HttpGet("{userId:long}/profile")]
    public async Task<ActionResult<PublicUserProfileDto>> GetProfile(long userId, CancellationToken ct)
    {
        if (!User.TryGetUserId(out var viewerId)) return Unauthorized();
        return Ok(await _social.GetProfileAsync(viewerId, userId, ct));
    }
}
