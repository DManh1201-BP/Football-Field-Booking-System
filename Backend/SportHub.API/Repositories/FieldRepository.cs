using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.DTOs;
using SportHub.API.Models;

namespace SportHub.API.Repositories;

public class FieldRepository : IFieldRepository
{
    private readonly SportHubDbContext _dbContext;

    public FieldRepository(SportHubDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Field>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Fields
            .AsNoTracking()
            .OrderBy(f => f.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Field?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Fields
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Fields
            .AnyAsync(f => f.Id == id, cancellationToken);
    }

    public async Task<List<Field>> GetAvailableAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Fields
            .AsNoTracking()
            .Where(f => f.IsAvailable)
            .OrderBy(f => f.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Field>> GetAvailableByCityAsync(string city, CancellationToken cancellationToken = default)
    {
        var normalizedCity = city.Trim();
        return await _dbContext.Fields
            .AsNoTracking()
            .Where(f => f.IsAvailable && f.City != null && f.City == normalizedCity)
            .OrderBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Field>> GetAvailableBySportTypeAsync(string sportType, CancellationToken cancellationToken = default)
    {
        var normalizedSport = sportType.Trim().ToUpperInvariant();
        return await _dbContext.Fields
            .AsNoTracking()
            .Where(f => f.IsAvailable && f.SportType.ToUpper() == normalizedSport)
            .OrderBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Field>> SearchAvailableAsync(FieldSearchQueryDto query, CancellationToken cancellationToken = default)
    {
        var fieldsQuery = _dbContext.Fields
            .AsNoTracking()
            .Where(f => f.IsAvailable);

        if (!string.IsNullOrWhiteSpace(query.City))
        {
            var city = query.City.Trim();
            fieldsQuery = fieldsQuery.Where(f => f.City != null && f.City.Contains(city));
        }

        if (!string.IsNullOrWhiteSpace(query.SportType))
        {
            var sportType = query.SportType.Trim().ToUpperInvariant();
            fieldsQuery = fieldsQuery.Where(f => f.SportType.ToUpper() == sportType);
        }

        if (query.MinPrice.HasValue)
        {
            fieldsQuery = fieldsQuery.Where(f => f.PricePerHour >= query.MinPrice.Value);
        }

        if (query.MaxPrice.HasValue)
        {
            fieldsQuery = fieldsQuery.Where(f => f.PricePerHour <= query.MaxPrice.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Amenity))
        {
            var amenity = query.Amenity.Trim();
            fieldsQuery = fieldsQuery.Where(f => f.Amenities != null && f.Amenities.Contains(amenity));
        }

        if (query.Date.HasValue && query.StartTime.HasValue && query.EndTime.HasValue)
        {
            var date = query.Date.Value;
            var start = query.StartTime.Value;
            var end = query.EndTime.Value;
            var now = DateTime.Now;

            fieldsQuery = fieldsQuery.Where(f => !_dbContext.Bookings.Any(b =>
                b.FieldId == f.Id &&
                b.BookingDate == date &&
                b.Status != "CANCELLED" &&
                (b.Status != "HOLD" || (b.HoldExpiresAt != null && b.HoldExpiresAt > now)) &&
                b.StartTime < end &&
                b.EndTime > start));
        }

        return await fieldsQuery
            .OrderBy(f => f.PricePerHour)
            .ThenBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Field>> GetByOwnerIdAsync(long ownerId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Fields
            .AsNoTracking()
            .Where(f => f.OwnerId == ownerId)
            .OrderBy(f => f.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Field> AddAsync(Field field, CancellationToken cancellationToken = default)
    {
        _dbContext.Fields.Add(field);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return field;
    }

    public async Task<Field> UpdateAsync(Field field, CancellationToken cancellationToken = default)
    {
        _dbContext.Fields.Update(field);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return field;
    }

    public async Task DeleteAsync(Field field, CancellationToken cancellationToken = default)
    {
        _dbContext.Fields.Remove(field);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
