using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SportHub.API.Middleware;

public class FlexibleTimeOnlyJsonConverter : JsonConverter<TimeOnly>
{
    private static readonly string[] SupportedFormats =
    {
        "HH:mm:ss",
        "HH:mm",
        "H:mm:ss",
        "H:mm",
        "HH:mm:ss.fff"
    };

    public override TimeOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var raw = reader.GetString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            throw new JsonException("Time value cannot be empty.");
        }

        if (TimeOnly.TryParseExact(raw.Trim(), SupportedFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed) ||
            TimeOnly.TryParse(raw.Trim(), CultureInfo.InvariantCulture, DateTimeStyles.None, out parsed))
        {
            return parsed;
        }

        throw new JsonException($"Invalid time format '{raw}'. Expected HH:mm or HH:mm:ss.");
    }

    public override void Write(Utf8JsonWriter writer, TimeOnly value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString("HH:mm:ss", CultureInfo.InvariantCulture));
    }
}
