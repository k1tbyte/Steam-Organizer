using System.Text.Json.Serialization;
using SteamOrganizer.Server.Lib.JsonConverters;

namespace SteamOrganizer.Server.Services.SteamParser.Responses;

public sealed class PlayerFriend : IIdentifiable
{
    [JsonConverter(typeof(ToNumberConverter))]
    public required ulong SteamId { get; set; }
    
    [JsonConverter(typeof(UnixToDateTimeConverter))]
    [JsonPropertyName("friend_since")]
    public DateTime? FriendSince { get; set; }
    public string? AvatarHash { get; set; }
    public string? PersonaName { get; set; }
}

public sealed class PlayerFriendsResponse
{

    public sealed class ResponseObject
    {
        public PlayerFriend[]? Friends { get; set; }
    }

    public ResponseObject? FriendsList { get; set; }
}