namespace SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

public sealed class PlayerBansObject
{
    // API Response in player summaries
    public class PlayerBans
    {
        public bool CommunityBanned { get; set; }
        public int NumberOfVacBans { get; set; }
        public int NumberOfGameBans { get; set; }
        public int DaysSinceLastBan { get; set; }
        public string EconomyBan { get; set; }
    }

    // Steam response and API Response
    public sealed class PlayerBansResponse : PlayerBans
    {
        public string SteamID { get; set; }
    }

    public PlayerBansResponse[] Players { get; set; }
}