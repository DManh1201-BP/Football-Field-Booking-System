using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.Models;

namespace SportHub.API.Repositories;

public class MatchRepository : IMatchRepository
{
    private readonly SportHubDbContext _dbContext;

    public MatchRepository(SportHubDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Match>> GetAllAsync(
        string? sportType = null,
        string? city = null,
        string? skillLevel = null,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Matches
            .AsNoTracking()
            .Include(m => m.HostUser)
            .Include(m => m.ChallengerUser)
            .Include(m => m.Field)
            .Include(m => m.Participants)
                .ThenInclude(p => p.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(sportType))
        {
            var normalizedSport = sportType.Trim().ToUpperInvariant();
            query = query.Where(m => m.SportType.ToUpper() == normalizedSport);
        }

        if (!string.IsNullOrWhiteSpace(city))
        {
            var normalizedCity = city.Trim();
            query = query.Where(m => m.City != null && m.City.Contains(normalizedCity));
        }

        if (!string.IsNullOrWhiteSpace(skillLevel))
        {
            var normalizedLevel = skillLevel.Trim().ToUpperInvariant();
            query = query.Where(m => m.SkillLevel.ToUpper() == normalizedLevel);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalizedStatus = status.Trim().ToUpperInvariant();
            query = query.Where(m => m.Status.ToUpper() == normalizedStatus);
        }

        return await query
            .OrderBy(m => m.MatchDate)
            .ThenBy(m => m.StartTime)
            .ToListAsync(cancellationToken);
    }

    public async Task<Match?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Matches
            .Include(m => m.HostUser)
            .Include(m => m.ChallengerUser)
            .Include(m => m.Field)
            .Include(m => m.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<Match> AddAsync(Match match, CancellationToken cancellationToken = default)
    {
        _dbContext.Matches.Add(match);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return match;
    }

    public async Task<Match> UpdateAsync(Match match, CancellationToken cancellationToken = default)
    {
        _dbContext.Matches.Update(match);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return match;
    }
}
