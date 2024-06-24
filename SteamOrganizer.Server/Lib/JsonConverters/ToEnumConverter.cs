using System.Text.Json;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Server.Lib.JsonConverters;

public sealed class ToEnumConverter<T> : JsonConverter<T> where T : struct, Enum
{
    public override T Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (Enum.TryParse<T>(value, ignoreCase: true, out var result))
        {
            return result;
        }
        
        throw new JsonException($"Unable to convert \"{value}\" to enum {typeof(T)}.");
    }

    public override void Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
    {
        writer.WriteNumberValue(Convert.ToInt32(value));
    }
}