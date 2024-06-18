using System.Text.Json;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Server.Lib.JsonConverters;

public sealed class SteamIdConverter : JsonConverter<ulong>
{
     public override ulong Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
     {
         var id = reader.TokenType == JsonTokenType.String ? 
             ulong.Parse(reader.GetString()!) : reader.GetUInt64();
         return id < UInt32.MaxValue ? id + Defines.SteamId64Indent : id;
     }

    public override void Write(Utf8JsonWriter writer, ulong value, JsonSerializerOptions options)
    {
        writer.WriteNumberValue(value > UInt32.MaxValue ?  value - Defines.SteamId64Indent : value);
    }
}

public sealed class SteamIdSetConverter : JsonConverter<HashSet<ulong>>
{
    public override HashSet<ulong> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var set = new HashSet<ulong>();
        while (reader.Read())
        {
            if (reader.TokenType == JsonTokenType.EndArray)
                break;
            
            var id = reader.GetUInt64();
            set.Add(id < UInt32.MaxValue ? id + Defines.SteamId64Indent : id);
        }

        return set; 
    }

    public override void Write(Utf8JsonWriter writer, HashSet<ulong> value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        foreach (ulong item in value)
        {
            writer.WriteNumberValue(item > UInt32.MaxValue ?  item - Defines.SteamId64Indent : item);
        }
        writer.WriteEndArray();
    }
}