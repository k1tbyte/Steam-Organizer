using System.Text.Json.Serialization;

namespace SteamOrganizer.Server.Services.SteamParser.Responses;

public sealed class PlayerGameInfo
{
    public uint AppId { get; set; }
    public float Playtime_forever { get; set; }
    public required string Name { get; set; }
    public string? FormattedPrice { get; set; }
}

public sealed class PlayerGames
{
    public PlayerGameInfo[]? Games { get; set; }
    public int GamesCount { get; set; }
    public int PlayedGamesCount { get; set; }
    public float HoursOnPlayed { get; set; }
    public ushort GamesBoundaryBadge { get; set; }
    public string? GamesPriceFormatted { get; set; }
    public decimal GamesPrice { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public int PaidGames { get; set; }
}


public sealed class PlayerGamesResponse
{
    public PlayerGames? Response { get; set; }
}

public sealed class GamePrice
{
    public decimal Initial { get; set; }
    public string? Formatted { get; set; }
}

public sealed class GameDetails
{

    public sealed class GameData
    {
        public GamePrice? Price_overview { get; set; }
    }

    public bool Success { get; set; }
    public GameData? Data { get; set; }
}