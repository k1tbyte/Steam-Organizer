using System.Text.Json.Serialization;
using SteamOrganizer.Server.Lib.JsonConverters;

namespace SteamOrganizer.Server.Services.SteamParser.Responses;

public sealed class PlayerSummaries
{
    public required string SteamId { get; set; }
    public string? AvatarHash { get; set; }
    public string? PersonaName { get; set; }

    [JsonConverter(typeof(SteamUrlConverter))]
    public string? ProfileUrl { get; set; }
    public string? LocCountryCode { get; set; }

    [JsonConverter(typeof(UnixToDateTimeConverter))]
    public DateTime? TimeCreated { get; set; }
    public byte CommunityVisibilityState { get; set; }
    public byte CommentPermission { get; set; }
    public int? SteamLevel { get; set; }
    public PlayerBans? Bans { get; set; }
    public PlayerGames? GamesSummaries { get; set; }
}

public sealed class PlayerSummariesResponse
{
    public sealed class ResponseObject
    {
        public PlayerSummaries[]? Players { get; set; }
    }
    public ResponseObject? Response { get; set; }
}