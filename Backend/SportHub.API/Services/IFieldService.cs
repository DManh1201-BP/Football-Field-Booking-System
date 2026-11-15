using Microsoft.AspNetCore.Http;
using SportHub.API.DTOs;

namespace SportHub.API.Services;

public interface IFieldService
{
    Task<List<FieldDto>> GetAllFieldsAsync(CancellationToken cancellationToken = default);
    Task<FieldDto> GetFieldByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<List<FieldDto>> GetAvailableFieldsAsync(CancellationToken cancellationToken = default);
    Task<List<FieldDto>> GetFieldsByCityAsync(string city, CancellationToken cancellationToken = default);
    Task<List<FieldDto>> GetFieldsBySportTypeAsync(string sportType, CancellationToken cancellationToken = default);
    Task<List<FieldDto>> SearchFieldsAsync(FieldSearchQueryDto query, CancellationToken cancellationToken = default);
    Task<FieldDto> CreateFieldAsync(FieldCreateDto dto, long? currentUserId = null, CancellationToken cancellationToken = default);
    Task<FieldDto> UpdateFieldAsync(long id, FieldUpdateDto dto, long? currentUserId = null, CancellationToken cancellationToken = default);
    Task DeleteFieldAsync(long id, CancellationToken cancellationToken = default);
    Task<FieldDto> UploadFieldImageAsync(long id, IFormFile file, long? currentUserId = null, CancellationToken cancellationToken = default);
}
