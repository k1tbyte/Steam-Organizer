using System.Text.Json;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Server.Lib.JsonConverters;

public class SteamUrlConverter : JsonConverter<string>
{
    public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var id = reader.GetString();

        if (id == null)
            return null;

        var splitId = id.Split('/');
        return splitId[3] == "id" ? splitId[4] : null;
    }

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
        => JsonSerializer.Serialize(writer, value, options);
}
