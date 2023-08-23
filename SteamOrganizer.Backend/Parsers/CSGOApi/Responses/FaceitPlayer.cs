namespace SteamOrganizer.Backend.Parsers.CSGOApi.Responses
{
    public class FaceitPlayerObject
    {
        public string? faceit_url { get; set; }
        public IList<string?> friends_ids { get; set; }
        public Games? games { get; set; }

        public class Games
        {
            public Game? csgo { get; set; }
            public class Game
            {
                public int faceit_elo { get; set; }
                public int skill_level { get; set; }
            }
        }
        public string? nickname { get; set; }
        public string? player_id { get; set; } //faceit id
        public string? steam_id_64 { get; set; }
        public string? steam_nickname { get; set; }
    }
}
