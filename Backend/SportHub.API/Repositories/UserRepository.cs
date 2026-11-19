using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.Models;

namespace SportHub.API.Repositories;

public class UserRepository : IUserRepository
{
    private readonly SportHubDbContext _dbContext;

    public UserRepository(SportHubDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
    }

    public Task<List<User>> GetAllAsync(CancellationToken cancellationToken = default) =>
        _dbContext.Users.AsNoTracking().OrderBy(u => u.FullName).ToListAsync(cancellationToken);

    public async Task<List<User>> GetLeaderboardAsync(int limit = 20, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.IsActive)
            .OrderByDescending(u => u.EloRating)
            .ThenBy(u => u.FullName)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<User> AddAsync(User user, CancellationToken cancellationToken = default)
    {
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<User> UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        _dbContext.Users.Update(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }
}
