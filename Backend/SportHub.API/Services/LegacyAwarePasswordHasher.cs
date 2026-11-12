namespace SportHub.API.Services;

public class LegacyAwarePasswordHasher : IPasswordHasher
{
    public string HashPassword(string rawPassword)
    {
        return BCrypt.Net.BCrypt.HashPassword(rawPassword);
    }

    public bool Verify(string rawPassword, string? encodedPassword)
    {
        if (string.IsNullOrEmpty(encodedPassword))
        {
            return false;
        }

        if (IsBcryptHash(encodedPassword))
        {
            return BCrypt.Net.BCrypt.Verify(rawPassword, encodedPassword);
        }

        return string.Equals(encodedPassword, rawPassword, StringComparison.Ordinal);
    }

    public bool NeedsRehash(string? encodedPassword)
    {
        return !string.IsNullOrEmpty(encodedPassword) && !IsBcryptHash(encodedPassword);
    }

    private static bool IsBcryptHash(string value)
    {
        return value.StartsWith("$2a$", StringComparison.Ordinal) ||
               value.StartsWith("$2b$", StringComparison.Ordinal) ||
               value.StartsWith("$2y$", StringComparison.Ordinal);
    }
}
