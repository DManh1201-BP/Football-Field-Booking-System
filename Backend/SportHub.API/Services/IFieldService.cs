using Microsoft.AspNetCore.Http;
using SportHub.API.DTOs;

namespace SportHub.API.Services;

public record PrivateFileResult(string FilePath, string ContentType, string FileName);

public interface IFieldService
{
    Task<List<PublicFieldDto>> GetAllFieldsAsync(long? currentUserId = null, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task<List<FieldDto>> GetManagedFieldsAsync(long? currentUserId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<PublicFieldDto> GetFieldByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<FieldDto> GetManagedFieldByIdAsync(long id, long? currentUserId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<List<PublicFieldDto>> GetAvailableFieldsAsync(CancellationToken cancellationToken = default);
    Task<List<PublicFieldDto>> GetFieldsByCityAsync(string city, CancellationToken cancellationToken = default);
    Task<List<PublicFieldDto>> GetFieldsBySportTypeAsync(string sportType, CancellationToken cancellationToken = default);
    Task<List<PublicFieldDto>> SearchFieldsAsync(FieldSearchQueryDto query, CancellationToken cancellationToken = default);
    Task<FieldDto> CreateFieldAsync(FieldCreateDto dto, long? currentUserId = null, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task<PublicFieldDto> SuggestCommunityFieldAsync(CommunityFieldSuggestDto dto, long currentUserId, CancellationToken cancellationToken = default);
    Task<FieldDto> UpdateFieldAsync(long id, FieldUpdateDto dto, long? currentUserId = null, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task DeleteFieldAsync(long id, CancellationToken cancellationToken = default);
    Task<FieldDto> UploadFieldImageAsync(long id, IFormFile file, long? currentUserId = null, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task<FieldDto> UploadVerificationDocAsync(long id, IFormFile file, long? currentUserId = null, bool isAdmin = false, CancellationToken cancellationToken = default);
    Task<PrivateFileResult> GetVerificationDocAsync(long id, long currentUserId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<FieldDto> VerifyFieldAsync(long id, long adminId, FieldVerifyDto dto, CancellationToken cancellationToken = default);
    Task<FieldClaimResponseDto> SubmitClaimAsync(long fieldId, long claimantUserId, FieldClaimCreateDto dto, CancellationToken cancellationToken = default);
    Task<string> UploadClaimEvidenceAsync(IFormFile file, long claimantUserId, CancellationToken cancellationToken = default);
    Task<PrivateFileResult> GetClaimEvidenceAsync(long claimId, long currentUserId, bool isAdmin, CancellationToken cancellationToken = default);
    Task<List<FieldClaimResponseDto>> GetClaimRequestsAsync(CancellationToken cancellationToken = default);
    Task<FieldClaimResponseDto> ReviewClaimAsync(long claimId, long adminId, FieldClaimReviewDto dto, CancellationToken cancellationToken = default);
    Task<FieldReportResponseDto> ReportFieldAsync(long fieldId, long reporterUserId, FieldReportCreateDto dto, CancellationToken cancellationToken = default);
    Task<List<FieldReportResponseDto>> GetFieldReportsAsync(CancellationToken cancellationToken = default);
    Task<FieldReportResponseDto> ResolveFieldReportAsync(long reportId, FieldReportResolveDto dto, CancellationToken cancellationToken = default);
}
