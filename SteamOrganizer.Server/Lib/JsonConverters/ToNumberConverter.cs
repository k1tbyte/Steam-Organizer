using System.Text.Json;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Server.Lib.JsonConverters;

public sealed class ToNumberConverter : JsonConverter<ulong>
{
    public override ulong Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String && ulong.TryParse(reader.GetString(), out var value))
        {
            return value;
        }
        throw new JsonException("Unable to convert string to ulong.");
    }

    public override void Write(Utf8JsonWriter writer, ulong value, JsonSerializerOptions options)
    {
        writer.WriteNumberValue(value);
    }
}