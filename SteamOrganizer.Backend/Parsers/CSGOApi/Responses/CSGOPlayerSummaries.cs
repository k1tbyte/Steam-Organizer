using SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

namespace SteamOrganizer.Backend.Parsers.CSGOStats.Responses;

public class CSGOPlayerSummaries
{
    public required SteamSummariesObject.SteamSummaries AccountInfo { get; set; }
    public MatchmakingStatsObject? MatchmakingStats { get; set; }
}
