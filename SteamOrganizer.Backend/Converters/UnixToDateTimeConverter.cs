using System.Text.Json.Serialization;
using System.Text.Json;

namespace SteamOrganizer.Backend.Converters;

public class UnixToDateTimeConverter : JsonConverter<DateTime?>
{
    public bool? IsFormatInSeconds { get; init; }

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        try
        {
            if (reader.TryGetInt64(out var time))
            {
                // if 'IsFormatInSeconds' is unspecified, then deduce the correct type based on whether it can be represented as seconds within the .net DateTime min/max range (1/1/0001 to 31/12/9999)
                // - because we're dealing with a 64bit value, the unix time in seconds can exceed the traditional 32bit min/max restrictions (1/1/1970 to 19/1/2038)
                if (IsFormatInSeconds == true || IsFormatInSeconds == null && time > _unixMinSeconds && time < _unixMaxSeconds)
                    return DateTimeOffset.FromUnixTimeSeconds(time).LocalDateTime;
                return DateTimeOffset.FromUnixTimeMilliseconds(time).LocalDateTime;
            }
        }
        catch
        {
            // despite the method prefix 'Try', TryGetInt64 will throw an exception if the token isn't a number.. hence we swallow it and return null
        }

        return null;
    }

    // write is out of scope, but this could be implemented via writer.ToUnixTimeMilliseconds/WriteNullValue
    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options) => JsonSerializer.Serialize(writer, value, options);

    private static readonly long _unixMinSeconds = DateTimeOffset.MinValue.ToUnixTimeSeconds(); // -62_135_596_800
    private static readonly long _unixMaxSeconds = DateTimeOffset.MaxValue.ToUnixTimeSeconds(); // 253_402_300_799
}
