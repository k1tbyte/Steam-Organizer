using SteamOrganizer.Backend.Converters;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

public sealed class PlayerSummaries
{
    public sealed class Player
    {
        public string SteamID { get; set; }
        public string? AvatarHash { get; set; }
        public string? PersonaName { get; set; }
        public string? ProfileURL { get; set; }
        public string? LocCountryCode { get; set; }

        [JsonConverter(typeof(UnixToDateTimeConverter))]
        public DateTime? TimeCreated { get; set; }
        public byte CommunityVisibilityState { get; set; }
        public byte CommentPermission { get; set; }
        public int? SteamLevel { get; set; }
    }
    public sealed class SummariesResponse
    {
        public Player[]? Players { get; set; }
    }

    public SummariesResponse? Response { get; set; }
}