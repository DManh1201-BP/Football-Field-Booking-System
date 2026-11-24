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
    public async Task<ActionResult<List<PublicFieldDto>>> GetAllFields(CancellationToken cancellationToken)
    {
        long? currentUserId = User.TryGetUserId(out var uid) ? uid : null;
        var fields = await _fieldService.GetAllFieldsAsync(currentUserId, User.IsAdmin(), cancellationToken);
        return Ok(fields);
    }

    [HttpGet("manage")]
    [Authorize(Roles = "ADMIN,OWNER")]
    public async Task<ActionResult<List<FieldDto>>> GetManagedFields(CancellationToken cancellationToken)
    {
        long? currentUserId = User.TryGetUserId(out var uid) ? uid : null;
        var fields = await _fieldService.GetManagedFieldsAsync(currentUserId, User.IsAdmin(), cancellationToken);
        return Ok(fields);
    }

    [HttpGet("{id:long}")]
    [AllowAnonymous]
    public async Task<ActionResult<PublicFieldDto>> GetFieldById(long id, CancellationToken cancellationToken)
    {
        var field = await _fieldService.GetFieldByIdAsync(id, cancellationToken);
        return Ok(field);
    }

    [HttpGet("{id:long}/manage")]
    [Authorize(Roles = "ADMIN,OWNER")]
    public async Task<ActionResult<FieldDto>> GetManagedFieldById(long id, CancellationToken cancellationToken)
    {
        long? currentUserId = User.TryGetUserId(out var uid) ? uid : null;
        var field = await _fieldService.GetManagedFieldByIdAsync(id, currentUserId, User.IsAdmin(), cancellationToken);
        return Ok(field);
    }

    [HttpGet("available")]
    [AllowAnonymous]
    public async Task<ActionResult<List<PublicFieldDto>>> GetAvailableFields(CancellationToken cancellationToken)
    {
        var fields = await _fieldService.GetAvailableFieldsAsync(cancellationToken);
        return Ok(fields);
    }

    [HttpGet("city/{city}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<PublicFieldDto>>> GetFieldsByCity(string city, CancellationToken cancellationToken)
    {
        var fields = await _fieldService.GetFieldsByCityAsync(city, cancellationToken);
        return Ok(fields);
    }

    [HttpGet("sport/{sportType}")]
    [AllowAnonymous]
    public async Task<ActionResult<List<PublicFieldDto>>> GetFieldsBySportType(string sportType, CancellationToken cancellationToken)
    {
        var fields = await _fieldService.GetFieldsBySportTypeAsync(sportType, cancellationToken);
        return Ok(fields);
    }

    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<List<PublicFieldDto>>> SearchFields(
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
        var created = await _fieldService.CreateFieldAsync(request, currentUserId, User.IsAdmin(), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "ADMIN,OWNER")]
    public async Task<ActionResult<FieldDto>> UpdateField(
        long id,
        [FromBody] FieldUpdateDto request,
        CancellationToken cancellationToken)
    {
        long? currentUserId = User.TryGetUserId(out var uid) ? uid : null;
        var updated = await _fieldService.UpdateFieldAsync(id, request, currentUserId, User.IsAdmin(), cancellationToken);
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
        long? currentUserId = User.TryGetUserId(out var uid) ? uid : null;
        var updated = await _fieldService.UploadFieldImageAsync(id, file, currentUserId, User.IsAdmin(), cancellationToken);
        return Ok(updated);
    }

    [HttpPost("{id:long}/verification-doc")]
    [Authorize(Roles = "ADMIN,OWNER")]
    public async Task<ActionResult<FieldDto>> UploadVerificationDoc(
        long id,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        long? currentUserId = User.TryGetUserId(out var uid) ? uid : null;
        var updated = await _fieldService.UploadVerificationDocAsync(id, file, currentUserId, User.IsAdmin(), cancellationToken);
        return Ok(updated);
    }

    [HttpGet("{id:long}/verification-doc")]
    [Authorize(Roles = "ADMIN,OWNER")]
    public async Task<IActionResult> DownloadVerificationDoc(long id, CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var uid)) return Unauthorized();
        var fileResult = await _fieldService.GetVerificationDocAsync(id, uid, User.IsAdmin(), cancellationToken);
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Cache-Control"] = "no-store";
        return PhysicalFile(fileResult.FilePath, fileResult.ContentType, enableRangeProcessing: false);
    }

    [HttpPost("community-suggest")]
    [Authorize]
    public async Task<ActionResult<PublicFieldDto>> SuggestCommunityField(
        [FromBody] CommunityFieldSuggestDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var uid)) return Unauthorized();
        var created = await _fieldService.SuggestCommunityFieldAsync(request, uid, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, created);
    }

    [HttpPost("claim-evidence")]
    [Authorize]
    public async Task<ActionResult<object>> UploadClaimEvidence(
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var uid)) return Unauthorized();
        var fileKey = await _fieldService.UploadClaimEvidenceAsync(file, uid, cancellationToken);
        return Ok(new { fileKey });
    }

    [HttpGet("claims/{claimId:long}/evidence")]
    [Authorize]
    public async Task<IActionResult> DownloadClaimEvidence(long claimId, CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var uid)) return Unauthorized();
        var fileResult = await _fieldService.GetClaimEvidenceAsync(claimId, uid, User.IsAdmin(), cancellationToken);
        Response.Headers["X-Content-Type-Options"] = "nosniff";
        Response.Headers["Cache-Control"] = "no-store";
        return PhysicalFile(fileResult.FilePath, fileResult.ContentType, enableRangeProcessing: false);
    }

    [HttpPost("{id:long}/claim")]
    [Authorize]
    public async Task<ActionResult<FieldClaimResponseDto>> SubmitClaim(
        long id,
        [FromBody] FieldClaimCreateDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var uid)) return Unauthorized();
        var claim = await _fieldService.SubmitClaimAsync(id, uid, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, claim);
    }

    [HttpPost("{id:long}/report")]
    [Authorize]
    public async Task<ActionResult<FieldReportResponseDto>> ReportField(
        long id,
        [FromBody] FieldReportCreateDto request,
        CancellationToken cancellationToken)
    {
        if (!User.TryGetUserId(out var uid)) return Unauthorized();
        var report = await _fieldService.ReportFieldAsync(id, uid, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, report);
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public ActionResult<string> Health()
    {
        return Ok("Field API is running");
    }
}
