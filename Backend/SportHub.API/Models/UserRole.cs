namespace SportHub.API.Models;

public enum UserRole
{
    CUSTOMER,
    OWNER,
    ADMIN
}

public static class UserRoleExtensions
{
    public static UserRole FromValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return UserRole.CUSTOMER;
        }

        var normalized = value.Trim().ToUpperInvariant();
        return normalized switch
        {
            "USER" or "CUSTOMER" => UserRole.CUSTOMER,
            "OWNER" => UserRole.OWNER,
            "STAFF" or "ADMIN" => UserRole.ADMIN,
            _ => Enum.TryParse<UserRole>(normalized, out var parsed)
                ? parsed
                : throw new ArgumentException($"Invalid user role: {value}")
        };
    }

    public static string NormalizeRole(string? value) => FromValue(value).ToString();
}
