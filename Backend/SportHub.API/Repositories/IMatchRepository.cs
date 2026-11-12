using SportHub.API.Models;

namespace SportHub.API.Repositories;

public interface IMatchRepository
{
    Task<List<Match>> GetAllAsync(
        string? sportType = null,
        string? city = null,
        string? skillLevel = null,
        string? status = null,
        CancellationToken cancellationToken = default);
    Task<Match?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<Match> AddAsync(Match match, CancellationToken cancellationToken = default);
    Task<Match> UpdateAsync(Match match, CancellationToken cancellationToken = default);
}
