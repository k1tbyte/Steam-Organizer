namespace SteamOrganizer.Backend.Parsers.CSGOApi.Responses
{
    public class FaceitMatchObject
    {
        public Teams? teams { get; set; }
        public class Teams
        {
            public Faction? faction1 { get; set; } //team1
            public Faction? faction2 { get; set; } //team2
            public class Faction
            {
                public string? name { get; set; } //team name
                public IList<PlayerId?> roster { get; set; } //roster faceit id list
                public class PlayerId
                {
                    public string? player_id { get; set; }
                }
            }
        }
    }
}
