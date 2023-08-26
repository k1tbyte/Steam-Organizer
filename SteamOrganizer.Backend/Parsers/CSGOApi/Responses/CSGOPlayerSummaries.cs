using SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

namespace SteamOrganizer.Backend.Parsers.CSGOApi.Responses;

public sealed class CSGOPlayerSummaries
{
    public required SteamSummariesObject.SteamSummaries AccountInfo { get; set; }
    public MatchmakingStatsObject? MatchmakingStats { get; set; }
    public FaceitStatsObject? FaceitStats { get; set; }
}
