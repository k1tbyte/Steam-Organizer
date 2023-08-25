using System.Text.Json.Serialization;

namespace SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

public sealed class PlayerOwnedGamesObject
{
    public sealed class OwnedGames
    {
        public Game[]? Games { get; set; }
        public int PlayedGamesCount { get; set; }
        public float HoursOnPlayed { get; set; }
        public ushort GamesBoundaryBadge { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public ulong TotalGamesPrice { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
        public int PaidGames { get; set; }
    }

    public sealed class Game
    {
        public uint AppID { get; set; }
        public float Playtime_forever { get; set; }
        public required string Name { get; set; }
        public string? FormattedPrice { get; set; }
    }

    public OwnedGames? Response { get; set; }
}

public sealed class AppDetailsObject
{
    public sealed class AppPrice
    {
        public string? Final_formatted { get; set; }
        public uint Initial { get; set; }
    }
    public sealed class AppData
    {
        public AppPrice? Price_overview { get; set; }
    }

    public bool Success { get; set; }
    public AppData? Data { get; set; }

    public bool FromCache { get; set; }
}
