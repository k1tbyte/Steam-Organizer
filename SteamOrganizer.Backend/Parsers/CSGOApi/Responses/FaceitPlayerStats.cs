using System.Text.Json.Serialization;

namespace SteamOrganizer.Backend.Parsers.CSGOApi.Responses
{
    public class FaceitPlayerStatsObject
    {
        public string? player_id{get; set;}
        public LifetimeStats? lifetime { get; set; } //account stats
        public IList<MapStats>? segments { get; set; } //map stats

        public class LifetimeStats
        {
            [JsonPropertyName("Average K/D Ratio")]
            public float AvgKD { get; set; }
            [JsonPropertyName("Average Headshots %")]
            public int AvgHs { get; set; }
            [JsonPropertyName("Matches")]
            public int Matches { get; set; }
            [JsonPropertyName("Win Rate %")]
            public int Winrate { get; set; }
            [JsonPropertyName("Wins")]
            public int Wins { get; set; }
            [JsonPropertyName("Longest Win Streak")]
            public int LongestWinStreak { get; set; }
        }
        public class MapStats
        {
            public Stats? stats { get; set; }
            public string? mode { get; set; } //game mode (5x5 etc)
            public string? label { get; set; } // map name
            public class Stats
            {
                public int Wins { get; set; }
                public int Matches { get; set; }
                [JsonPropertyName("Win Rate %")]
                public int AvgWinRate { get; set; }
                [JsonPropertyName("Average Headshots %")]
                public int AvgHS { get; set; }
                [JsonPropertyName("Average Kills")]
                public float AvgKills { get; set; }
                [JsonPropertyName("Average Deaths")]
                public float AvgDeaths { get; set; }
                [JsonPropertyName("Average K/D Ratio")]
                public float AvgKD { get; set; }
                [JsonPropertyName("Average K/R Ratio")]
                public float AvgKR { get; set; }
                [JsonPropertyName("Average Assists")]
                public float AvgAssists { get; set; }

            }

        }
    }
}
