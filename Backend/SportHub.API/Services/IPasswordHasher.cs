namespace SportHub.API.Services;

public interface IPasswordHasher
{
    string HashPassword(string rawPassword);
    bool Verify(string rawPassword, string? encodedPassword);
    bool NeedsRehash(string? encodedPassword);
}
