using SteamOrganizer.Backend.Converters;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

public sealed class PlayerSummariesObject
{
    public class PlayerSummaries
    {
        public string AvatarHash { get; set; }
        public string? PersonaName { get; set; }
        public string? ProfileURL { get; set; }
        public string? LocCountryCode { get; set; }

        [JsonConverter(typeof(UnixToDateTimeConverter))]
        public DateTime? TimeCreated { get; set; }
        public byte CommunityVisibilityState { get; set; }
        public byte CommentPermission { get; set; }
        public int? SteamLevel { get; set; }
        public PlayerBansObject.PlayerBans? Bans { get; set; }
        public PlayerOwnedGamesObject.OwnedGames? GamesSummaries { get; set; }

    }
    public sealed class PlayerSummariesResponse : PlayerSummaries
    {
        public string SteamID { get; set; }
    }

    public sealed class SummariesResponse
    {
        public PlayerSummariesResponse[]? Players { get; set; }
    }

    public SummariesResponse? Response { get; set; }
}