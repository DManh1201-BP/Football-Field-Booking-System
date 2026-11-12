using SportHub.API.DTOs;
using SportHub.API.Models;

namespace SportHub.API.Repositories;

public interface IFieldRepository
{
    Task<List<Field>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Field?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(long id, CancellationToken cancellationToken = default);
    Task<List<Field>> GetAvailableAsync(CancellationToken cancellationToken = default);
    Task<List<Field>> GetAvailableByCityAsync(string city, CancellationToken cancellationToken = default);
    Task<List<Field>> GetAvailableBySportTypeAsync(string sportType, CancellationToken cancellationToken = default);
    Task<List<Field>> SearchAvailableAsync(FieldSearchQueryDto query, CancellationToken cancellationToken = default);
    Task<List<Field>> GetByOwnerIdAsync(long ownerId, CancellationToken cancellationToken = default);
    Task<Field> AddAsync(Field field, CancellationToken cancellationToken = default);
    Task<Field> UpdateAsync(Field field, CancellationToken cancellationToken = default);
    Task DeleteAsync(Field field, CancellationToken cancellationToken = default);
}
