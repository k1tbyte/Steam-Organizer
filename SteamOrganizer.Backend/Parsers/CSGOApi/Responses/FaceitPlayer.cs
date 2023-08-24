using System.Text.Json.Serialization;

namespace SteamOrganizer.Backend.Parsers.CSGOApi.Responses
{
    public sealed class FaceitPlayerObject
    {
        public sealed class Game
        {
            public int Faceit_elo { get; set; }
            public byte Skill_level { get; set; }
        }
        public sealed class GamesList
        {
            public Game? Csgo { get; set; }
        }


        public GamesList? Games { get; set; }

        [JsonPropertyName("player_id")]
        public required string FaceitID { get; set; } 
    }
}
