namespace SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

public struct PlayerLevelObject
{
    public struct PlayerLevel
    {
        public int? Player_level { get; set; }
    }

    public PlayerLevel Response { get; set; }
}
