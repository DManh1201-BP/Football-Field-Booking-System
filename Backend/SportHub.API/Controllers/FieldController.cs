using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SportHub.API.DTOs;
using SportHub.API.Services;

namespace SportHub.API.Controllers;

[ApiController]
[Route("api/fields")]
public class FieldController : ControllerBase
{
    private readonly IFieldService _fieldService;

    public FieldController(IFieldService fieldService)
    {
        _fieldService = fieldService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<FieldDto>>> GetAllFields(CancellationToken cancellationToken)
    {
        var fields = await _fieldService.GetAllFieldsAsync(cancellationToken);
        return Ok(fields);
    }

    [HttpGet("{id:long}")]
    [AllowAnonymous]
    public async Task<ActionResult<FieldDto>> GetFieldById(long id, CancellationToken cancellationToken)
    {
        var field = await _fieldService.GetFieldByIdAsync(id, cancellationToken);
        return Ok(field);
    }

    [HttpGet("available")]
    [AllowAnonymous]
    public async Task<ActionResult<List<FieldDto>>> GetAvailableFields(CancellationToken cancellationToken)
    {
        var fields = await _fieldService.GetAvailableFieldsAsync(cancellationToken);
        return Ok(fields);
    }

    [HttpGet("city/{city}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<FieldDto>>> GetFieldsByCity(string city, CancellationToken cancellationToken)
    {
        var fields = await _fieldService.GetFieldsByCityAsync(city, cancellationToken);
        return Ok(fields);
    }

    [HttpGet("sport/{sportType}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<FieldDto>>> GetFieldsBySportType(string sportType, CancellationToken cancellationToken)
    {
        var fields = await _fieldService.GetFieldsBySportTypeAsync(sportType, cancellationToken);
        return Ok(fields);
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<List<FieldDto>>> SearchFields(
        [FromQuery] FieldSearchQueryDto query,
        CancellationToken cancellationToken)
    {
        var fields = await _fieldService.SearchFieldsAsync(query, cancellationToken);
        return Ok(fields);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,OWNER")]
    public async Task<ActionResult<FieldDto>> CreateField(
        [FromBody] FieldCreateDto request,
        CancellationToken cancellationToken)
    {
        long? currentUserId = User.TryGetUserId(out var uid) ? uid : null;
        var created = await _fieldService.CreateFieldAsync(request, currentUserId, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,OWNER")]
    public async Task<ActionResult<FieldDto>> UpdateField(
        long id,
        [FromBody] FieldUpdateDto request,
        CancellationToken cancellationToken)
    {
        var updated = await _fieldService.UpdateFieldAsync(id, request, cancellationToken);
        return Ok(updated);
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteField(long id, CancellationToken cancellationToken)
    {
        await _fieldService.DeleteFieldAsync(id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:long}/image")]
    [Authorize(Roles = "ADMIN,OWNER")]
    public async Task<ActionResult<FieldDto>> UploadFieldImage(
        long id,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        var updated = await _fieldService.UploadFieldImageAsync(id, file, cancellationToken);
        return Ok(updated);
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public ActionResult<string> Health()
    {
        return Ok("Field API is running");
    }
}
