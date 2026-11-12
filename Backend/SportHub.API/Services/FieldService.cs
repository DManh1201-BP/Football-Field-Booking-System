using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using SportHub.API.DTOs;
using SportHub.API.Models;
using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class FieldService : IFieldService
{
    private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };

    private const long MaxImageBytes = 5 * 1024 * 1024;

    private readonly IFieldRepository _fieldRepository;
    private readonly IWebHostEnvironment _environment;

    public FieldService(IFieldRepository fieldRepository, IWebHostEnvironment environment)
    {
        _fieldRepository = fieldRepository;
        _environment = environment;
    }

    public async Task<List<FieldDto>> GetAllFieldsAsync(CancellationToken cancellationToken = default)
    {
        var fields = await _fieldRepository.GetAllAsync(cancellationToken);
        return fields.Select(FieldDto.FromEntity).ToList();
    }

    public async Task<FieldDto> GetFieldByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        return FieldDto.FromEntity(field);
    }

    public async Task<List<FieldDto>> GetAvailableFieldsAsync(CancellationToken cancellationToken = default)
    {
        var fields = await _fieldRepository.GetAvailableAsync(cancellationToken);
        return fields.Select(FieldDto.FromEntity).ToList();
    }

    public async Task<List<FieldDto>> GetFieldsByCityAsync(string city, CancellationToken cancellationToken = default)
    {
        var fields = await _fieldRepository.GetAvailableByCityAsync(city, cancellationToken);
        return fields.Select(FieldDto.FromEntity).ToList();
    }

    public async Task<List<FieldDto>> GetFieldsBySportTypeAsync(string sportType, CancellationToken cancellationToken = default)
    {
        var fields = await _fieldRepository.GetAvailableBySportTypeAsync(sportType, cancellationToken);
        return fields.Select(FieldDto.FromEntity).ToList();
    }

    public async Task<List<FieldDto>> SearchFieldsAsync(FieldSearchQueryDto query, CancellationToken cancellationToken = default)
    {
        if (query.StartTime.HasValue && query.EndTime.HasValue && query.EndTime.Value <= query.StartTime.Value)
        {
            throw new ArgumentException("End time must be after start time");
        }

        if (query.MinPrice.HasValue && query.MaxPrice.HasValue && query.MinPrice.Value > query.MaxPrice.Value)
        {
            throw new ArgumentException("Minimum price cannot exceed maximum price");
        }

        var fields = await _fieldRepository.SearchAvailableAsync(query, cancellationToken);
        return fields.Select(FieldDto.FromEntity).ToList();
    }

    public async Task<FieldDto> CreateFieldAsync(FieldCreateDto dto, long? currentUserId = null, CancellationToken cancellationToken = default)
    {
        var field = new Field
        {
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            Location = dto.Location.Trim(),
            City = dto.City?.Trim(),
            Province = dto.Province?.Trim(),
            ImageUrl = dto.ImageUrl?.Trim(),
            PricePerHour = dto.PricePerHour ?? throw new ArgumentException("Price per hour is required"),
            Capacity = dto.Capacity,
            SportType = dto.SportType.Trim().ToUpperInvariant(),
            Amenities = dto.Amenities?.Trim(),
            IsAvailable = dto.IsAvailable ?? true,
            OwnerId = dto.OwnerId ?? currentUserId
        };

        var saved = await _fieldRepository.AddAsync(field, cancellationToken);
        return FieldDto.FromEntity(saved);
    }

    public async Task<FieldDto> UpdateFieldAsync(long id, FieldUpdateDto dto, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        if (dto.Name is not null) field.Name = dto.Name.Trim();
        if (dto.Description is not null) field.Description = dto.Description.Trim();
        if (dto.Location is not null) field.Location = dto.Location.Trim();
        if (dto.City is not null) field.City = dto.City.Trim();
        if (dto.Province is not null) field.Province = dto.Province.Trim();
        if (dto.ImageUrl is not null) field.ImageUrl = dto.ImageUrl.Trim();
        if (dto.PricePerHour.HasValue) field.PricePerHour = dto.PricePerHour.Value;
        if (dto.Capacity.HasValue) field.Capacity = dto.Capacity.Value;
        if (dto.SportType is not null) field.SportType = dto.SportType.Trim().ToUpperInvariant();
        if (dto.Amenities is not null) field.Amenities = dto.Amenities.Trim();
        if (dto.IsAvailable.HasValue) field.IsAvailable = dto.IsAvailable.Value;
        if (dto.OwnerId.HasValue) field.OwnerId = dto.OwnerId.Value;

        var updated = await _fieldRepository.UpdateAsync(field, cancellationToken);
        return FieldDto.FromEntity(updated);
    }

    public async Task DeleteFieldAsync(long id, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        await _fieldRepository.DeleteAsync(field, cancellationToken);
    }

    public async Task<FieldDto> UploadFieldImageAsync(long id, IFormFile file, CancellationToken cancellationToken = default)
    {
        var field = await _fieldRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Field not found: {id}");

        if (file is null || file.Length == 0)
        {
            throw new ArgumentException("Image file is required");
        }

        if (file.Length > MaxImageBytes)
        {
            throw new ArgumentException("Image size must not exceed 5 MB");
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedImageExtensions.Contains(extension))
        {
            throw new ArgumentException("Only .jpg, .jpeg, .png, and .webp images are supported");
        }

        var webRoot = _environment.WebRootPath
            ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploadsFolder = Path.Combine(webRoot, "uploads", "fields");
        Directory.CreateDirectory(uploadsFolder);

        var safeFileName = $"field_{id}_{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var fullPath = Path.Combine(uploadsFolder, safeFileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        field.ImageUrl = $"/uploads/fields/{safeFileName}";
        var updated = await _fieldRepository.UpdateAsync(field, cancellationToken);
        return FieldDto.FromEntity(updated);
    }
}
