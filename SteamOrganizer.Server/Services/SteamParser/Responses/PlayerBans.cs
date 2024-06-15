namespace SteamOrganizer.Server.Services.SteamParser.Responses;

public sealed class PlayerBans
{
    public bool CommunityBanned { get; set; }
    public int NumberOfVacBans { get; set; }
    public int NumberOfGameBans { get; set; }
    public int DaysSinceLastBan { get; set; }
    public string? EconomyBan { get; set; }
}

public sealed class PlayerBansResponse
{
    public PlayerBans[]? Players { get; set; }
}