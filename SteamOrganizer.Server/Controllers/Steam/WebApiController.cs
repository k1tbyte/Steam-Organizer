using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using SteamOrganizer.Server.Filters;
using SteamOrganizer.Server.Services;
using SteamOrganizer.Server.Services.SteamParser;
using SteamOrganizer.Server.Services.SteamParser.Responses;

namespace SteamOrganizer.Server.Controllers.Steam;

[ApiKey]
[Route($"{Defines.ApiVersion}/steam/[controller]/[action]")]
public sealed class WebApiController(SteamParser parser) : ControllerBase
{
    [HttpGet]
    public async Task<PlayerSummaries?> GetSummaries(SummariesRequest request)
    {
        return await parser
            .SetCurrency(request.Currency)
            .GetInfo(request.Ids.First(), request.IncludeGames);
    }

    [HttpGet]
    public async Task<PlayerGames?> GetGames(GamesRequest request)
    {
        var response = await parser.SetCurrency(request.Currency).GetGames(
            request.SteamId!.Value,
            HttpContext.RequestAborted,
            request.WithDetails
        ).ConfigureAwait(false);
        
        return response;
    }

    [HttpGet]
    public async Task GetFriends([Required] ulong? steamId)
    {
        
    }

    [HttpPost]
    public async Task GetSummariesStream([FromBody] SummariesRequest request)
    {
        var httpResponse = HttpContext.Response;
        httpResponse.ContentType = "text/event-stream";
        
    }
}

public sealed record SummariesRequest(
    [Required,Length(1, 1000)] HashSet<ulong> Ids,
    bool IncludeGames,
    string? Currency
);

public sealed record GamesRequest(
    [Required] ulong? SteamId,
    bool WithDetails,
    string? Currency
);