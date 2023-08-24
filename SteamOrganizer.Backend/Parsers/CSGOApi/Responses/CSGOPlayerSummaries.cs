using SteamOrganizer.Backend.Parsers.CsgoAPI.Responses;
using SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

namespace SteamOrganizer.Backend.Parsers.CSGOStats.Responses;

public sealed class CSGOPlayerSummaries
{
    public required SteamSummariesObject.SteamSummaries AccountInfo { get; set; }
    public MatchmakingStatsObject? MatchmakingStats { get; set; }
    public FaceitStatsObject? FaceitStats { get; set; }
}
