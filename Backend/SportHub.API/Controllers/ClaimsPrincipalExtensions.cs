using System.Security.Claims;

namespace SportHub.API.Controllers;

public static class ClaimsPrincipalExtensions
{
    public static bool TryGetUserId(this ClaimsPrincipal principal, out long userId)
    {
        var explicitId = principal.FindFirstValue("userId");
        if (long.TryParse(explicitId, out userId))
        {
            return true;
        }

        foreach (var claim in principal.FindAll(ClaimTypes.NameIdentifier))
        {
            if (long.TryParse(claim.Value, out userId))
            {
                return true;
            }
        }

        userId = 0;
        return false;
    }

    public static bool IsAdmin(this ClaimsPrincipal principal)
    {
        return principal.IsInRole("ADMIN");
    }
}
