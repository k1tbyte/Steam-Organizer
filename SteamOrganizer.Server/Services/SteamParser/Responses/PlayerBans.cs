using System.Text.Json.Serialization;
using SteamOrganizer.Server.Lib.JsonConverters;

namespace SteamOrganizer.Server.Services.SteamParser.Responses;

public enum EEconomyBan : byte
{
    None = 0,
    Probation = 1,
    Banned = 2
}

public sealed class PlayerBans : IIdentifiable
{
    public bool CommunityBanned { get; set; }
    public int NumberOfVacBans { get; set; }
    public int NumberOfGameBans { get; set; }
    public int DaysSinceLastBan { get; set; }
    [JsonConverter(typeof(ToEnumConverter<EEconomyBan>))]
    public EEconomyBan EconomyBan { get; set; }

    [JsonConverter(typeof(SteamIdConverter))]
    [JsonPropertyName("SteamId")]
    public ulong Id
    {
        set => SteamId = value;
    }

    [JsonIgnore]
    public ulong SteamId { get; private set; }
}

public sealed class PlayerBansResponse
{
    public required PlayerBans[] Players { get; set; }
}