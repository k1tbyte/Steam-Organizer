using Microsoft.AspNetCore.Mvc;
using SteamOrganizer.Backend.Core;
using SteamOrganizer.Backend.Parsers.CSGOApi;
using SteamOrganizer.Backend.Parsers.CSGOApi.Responses;
using SteamOrganizer.Backend.Parsers.SteamAPI;

namespace SteamOrganizer.Backend.Controllers.CSGOService;

[ApiController]
[Route("CSGOService")]
public class CSGOSummariesController : ControllerBase
{
    [HttpGet("MatchmakingStats")]
    public async Task<Dictionary<string, MatchmakingStatsObject?>?> GetMatchmakingStatsAsync(string steamids)
    {
        var ids = steamids.Replace(" ", string.Empty).Split(',').Where(o => ulong.TryParse(o,out ulong result));
        if (ids == null)
        {
            BadRequest($"{steamids}");
            return null;
        }
        var dict = new Dictionary<string, MatchmakingStatsObject?>();

        try
        {
            await Parallel.ForEachAsync(ids, new ParallelOptions { MaxDegreeOfParallelism = WebBrowser.MaxDegreeOfParallelism, CancellationToken = HttpContext.RequestAborted },
            async (id, token) =>
            {
                var result = await CsgoParser.GetMatchmakingStats(id).ConfigureAwait(false);
                dict.TryAdd(id, result);
            }).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            return null;
        }

        return dict;
    }

    [HttpGet("FaceitStats")]
    public async Task<Dictionary<string, FaceitStatsObject?>?>  GetFaceitStatsAsync(string steamids)
    {
        var ids = steamids.Replace(" ", string.Empty).Split(',').Where(o => ulong.TryParse(o, out ulong result));
        if (ids == null)
        {
            BadRequest($"{steamids}");
            return null;
        }

        var dict = new Dictionary<string, FaceitStatsObject?>();

        try
        {
            await Parallel.ForEachAsync(ids, new ParallelOptions { MaxDegreeOfParallelism = WebBrowser.MaxDegreeOfParallelism, CancellationToken = HttpContext.RequestAborted },
            async (id, token) =>
            {
                var result = await CsgoParser.GetFaceitStats(id).ConfigureAwait(false);
                dict.TryAdd(id, result);
            }).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            return null;
        }


        return dict;
    }


    [HttpGet("PlayerSummaries")]
    public async Task<Dictionary<string, CSGOPlayerSummaries>?> GetCSGOSummariesAsync(string steamids)
    {
        var ids = steamids.Replace(" ", string.Empty).Split(',').Where(o => ulong.TryParse(o, out ulong result));
        if (ids == null || ids.Count() > 100)
        {
            BadRequest($"{steamids}");
            return null;
        }

        var steamSummaries = await SteamParser.GetPlayersSummaries(ids.Select(ulong.Parse).ToArray());
        if(steamSummaries == null)
        {
            Results.Problem("Unable to get steam summaries");
            return null;
        }

        var dict = new Dictionary<string, CSGOPlayerSummaries>();

        try
        {
            await Parallel.ForEachAsync(steamSummaries, new ParallelOptions { MaxDegreeOfParallelism = WebBrowser.MaxDegreeOfParallelism, CancellationToken = HttpContext.RequestAborted },
            async (player, token) =>
            {
                var matchmakingTask = CsgoParser.GetMatchmakingStats(player.SteamID).ConfigureAwait(false);
                var faceitTask = CsgoParser.GetFaceitStats(player.SteamID).ConfigureAwait(false);

                dict.Add(player.SteamID, new CSGOPlayerSummaries
                {
                    AccountInfo = player,
                    MatchmakingStats = await matchmakingTask,
                    FaceitStats = await faceitTask
                });
            });
        }
        catch (OperationCanceledException)
        {
            return null;
        }


        return dict;
    }

}
