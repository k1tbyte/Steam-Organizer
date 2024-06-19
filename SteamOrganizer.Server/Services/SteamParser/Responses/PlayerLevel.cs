namespace SteamOrganizer.Server.Services.SteamParser.Responses;

public class PlayerLevelResponse
{
    public struct PlayerLevel
    {
        public int? Player_level { get; set; }
    }

    public PlayerLevel Response { get; set; }
}