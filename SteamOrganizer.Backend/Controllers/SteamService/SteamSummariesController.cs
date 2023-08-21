using Microsoft.AspNetCore.Mvc;
using SteamOrganizer.Backend.Parsers.SteamAPI;
using System.Text;
using System.Text.Json;

namespace SteamOrganizer.Backend.Controllers.SteamService;

[ApiController]
[Route("SteamService/GetPlayerSummaries")]
public sealed class SteamSummariesController : ControllerBase
{
    private readonly ILogger<SteamSummariesController> _logger;
    private const int MaxAttempts = 5;

    public SteamSummariesController(ILogger<SteamSummariesController> logger)
    {
        _logger = logger;
    }

    [HttpPost]
    public async Task PostAsync(ulong[] steamid, bool includeLevel = true, bool includeBans = true, bool includeGames = false, bool includeFriends = false)
    {
        var response         = HttpContext.Response;
        response.StatusCode  = 200;
        response.ContentType = "text/event-stream";
        var locker           = new object();

        var unique = steamid.Distinct().ToArray();

        for (int i = 0, attempt = 0, remainingCount = unique.Length; i < unique.Length; i += 100)
        {
            var chunk = unique
                .Skip(i)
                .Take(100)
                .ToArray();

            var summaries = await SteamParser.GetPlayersSummaries(chunk).ConfigureAwait(false);

            if(summaries == null)
            {
                response.StatusCode = 404;
                return;
            }    

            await Parallel.ForEachAsync(summaries,
                new ParallelOptions() { MaxDegreeOfParallelism = Environment.ProcessorCount * 2 }, async (player,token) =>
            {
                if(includeLevel)
                {
                    player.SteamLevel = await SteamParser.GetPlayerLevel(player.SteamID).ConfigureAwait(false);
                }


                lock (locker)
                {
                    response.WriteAsync(JsonSerializer.Serialize(player) + '\n').Wait();
                    response.Body.Flush();
                }
            });
        }





        response.Body.Close();
    }
}
