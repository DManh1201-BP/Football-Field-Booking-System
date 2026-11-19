using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportHub.API.Controllers;
using SportHub.API.DTOs;
using SportHub.API.Models;
using SportHub.API.Repositories;

namespace SportHub.API.Controllers;

[ApiController, Route("api/admin/users"), Authorize(Roles = "ADMIN")]
public class AdminUsersController : ControllerBase
{
    private readonly IUserRepository _users;
    public AdminUsersController(IUserRepository users) => _users = users;

    [HttpGet]
    public async Task<ActionResult<List<AdminUserResponseDto>>> GetUsers(CancellationToken ct)
    {
        var users = await _users.GetAllAsync(ct);
        return Ok(users.Select(AdminUserResponseDto.FromUser).ToList());
    }

    [HttpPatch("{id:long}/role")]
    public async Task<ActionResult<AdminUserResponseDto>> UpdateRole(long id, [FromBody] AdminUserRoleUpdateDto request, CancellationToken ct)
    {
        var user = await _users.GetByIdAsync(id, ct);
        if (user is null) return NotFound();
        if (!User.TryGetUserId(out var adminId)) return Unauthorized();

        string role;
        try { role = UserRoleExtensions.NormalizeRole(request.Role); }
        catch (ArgumentException) { return BadRequest(new { message = "Role must be CUSTOMER, OWNER, or ADMIN." }); }

        if (user.Id == adminId && user.Role != role)
            return Conflict(new { message = "You cannot change your own role." });

        user.Role = role;
        var updated = await _users.UpdateAsync(user, ct);
        return Ok(AdminUserResponseDto.FromUser(updated));
    }
}
