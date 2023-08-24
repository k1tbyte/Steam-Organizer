using System.Text.Json.Serialization;

namespace SteamOrganizer.Backend.Parsers.CSGOApi.Responses
{
    public sealed class FaceitPlayerStatsObject
    {
        [JsonPropertyName("lifetime")]
        public FaceitOverallStats? OverallStats { get; set; }

        [JsonPropertyName("segments")]
        public MapStats[]? Maps { get; set; }

        public class FaceitOverallStats
        {
            public string? Matches { get; set; }
            public string? Wins { get; set; }

            [JsonPropertyName("Average K/D Ratio")]
            public string? AvgKD { get; set; }

            [JsonPropertyName("Average Headshots %")]
            public string? AvgHs { get; set; }

            [JsonPropertyName("Win Rate %")]
            public string? Winrate { get; set; }

            [JsonPropertyName("Longest Win Streak")]
            public string? LongestWinStreak { get; set; }
        }

        public class GameStats
        {
            public string? Wins { get; set; }
            public string? Matches { get; set; }

            [JsonPropertyName("Win Rate %")]
            public string? AvgWinRate { get; set; }

            [JsonPropertyName("Average Headshots %")]
            public string? AvgHS { get; set; }

            [JsonPropertyName("Average Kills")]
            public string? AvgKills { get; set; }

            [JsonPropertyName("Average Deaths")]
            public string? AvgDeaths { get; set; }

            [JsonPropertyName("Average K/D Ratio")]
            public string? AvgKD { get; set; }

            [JsonPropertyName("Average K/R Ratio")]
            public string? AvgKR { get; set; }

            [JsonPropertyName("Average Assists")]
            public string? AvgAssists { get; set; }

        }

        public class MapStats
        {
            public GameStats? Stats { get; set; }
            public string? Mode { get; set; } //game mode (5x5 etc)

            [JsonPropertyName("label")]
            public string? MapName { get; set; }
        }
    }
}
