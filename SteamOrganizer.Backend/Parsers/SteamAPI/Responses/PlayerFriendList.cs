using SteamOrganizer.Backend.Converters;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

public sealed class PlayerFriendListObject
{
    public sealed class Friend
    {
        public string SteamID { get; set; }

        [JsonConverter(typeof(UnixToDateTimeConverter))]
        public DateTime? Friend_since { get; set; }

        public string Avatarhash { get; set; }

        public string? PersonaName { get; set; }
    }
    public sealed class FriendList
    {
        public Friend[]? Friends { get; set; }
    }

    public FriendList FriendsList { get; set; }
}
