using System.Text.Json;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Server.Lib.JsonConverters;

public sealed class UnixToDateTimeConverter : JsonConverter<DateTime?>
{
    public bool? IsFormatInSeconds { get; init; }

    public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (!reader.TryGetInt64(out var time))
            return null;
        
        // if 'IsFormatInSeconds' is unspecified, then deduce the correct type based on whether it can be represented as seconds within the .net DateTime min/max range (1/1/0001 to 31/12/9999)
        // - because we're dealing with a 64bit value, the unix time in seconds can exceed the traditional 32bit min/max restrictions (1/1/1970 to 19/1/2038)
        if (IsFormatInSeconds == true || IsFormatInSeconds == null && time > UnixMinSeconds && time < UnixMaxSeconds)
            return DateTimeOffset.FromUnixTimeSeconds(time).LocalDateTime;
        return DateTimeOffset.FromUnixTimeMilliseconds(time).LocalDateTime;

    }

    // write is out of scope, but this could be implemented via writer.ToUnixTimeMilliseconds/WriteNullValue
    public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options) => JsonSerializer.Serialize(writer, value, options);

    private static readonly long UnixMinSeconds = DateTimeOffset.MinValue.ToUnixTimeSeconds(); // -62_135_596_800
    private static readonly long UnixMaxSeconds = DateTimeOffset.MaxValue.ToUnixTimeSeconds(); // 253_402_300_799
}