using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Backend.Parsers.CSGOApi.Responses;

public sealed class MatchmakingStatsObject
{
    public sealed class OverallObject
    {
        public byte Wr { get; set; }
        public uint Adr { get; set; }
        public byte Hs { get; set; }
        public float Kpd { get; set; }
        public float Rating { get; set; }

        [JsonPropertyName("1vX")]
        public byte ClutchPercent { get; set; }
    }
    public sealed class MapsObject
    {
        public object Overall { get; set; }
    }

    public OverallObject? Overall { get; set; }
    public MapsObject? Maps { get; set; }
    public byte Rank { get; set; }
    public uint Comp_wins { get; set; }
}
