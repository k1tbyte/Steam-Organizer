namespace SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

public struct PlayerLevel
{
    public struct LevelResponse
    {
        public int? Player_level { get; set; }
    }

    public LevelResponse Response { get; set; }
}
