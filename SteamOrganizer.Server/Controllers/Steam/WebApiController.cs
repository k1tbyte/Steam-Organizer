using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using SteamOrganizer.Server.Filters;
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
            .GetPlayerInfo(request.Ids.First(), request.IncludeGames);
    }
    
    [HttpPost]
    public async Task GetSummariesStream([FromBody] SummariesRequest request)
    {
        Response.ContentType = "text/event-stream";
        
        using var locker = new SemaphoreSlim(1,1);
        
        await using var responseStream = Response.BodyWriter.AsStream();
        
        var result = await parser
            .SetCurrency(request.Currency)
            .GetPlayerInfo(request.Ids, request.IncludeGames, async (player,token) =>
            {
                await locker.WaitAsync(token);
                await Response.WriteAsync("data: ",token);
                await JsonSerializer.SerializeAsync(responseStream, player, Defines.JsonOptions, token);
                await Response.WriteAsync("\r\r", token);
                await Response.Body.FlushAsync(token);
                locker.Release();
            });

        if (result == ESteamApiResult.OK)
        {
            Ok();
            return;
        }

        BadRequest(result.ToString());
    }

    [HttpGet]
    public async Task<PlayerGames?> GetGames(GamesRequest request)
    {
        var response = await parser.SetCurrency(request.Currency).GetGames(
            request.SteamId!.Value,
            request.WithDetails
        ).ConfigureAwait(false);
        
        return response;
    }

    [HttpGet]
    public async Task<PlayerFriend[]?> GetFriends([Required] ulong? steamId)
    {
        return await parser.GetFriendsInfo(steamId!.Value);
    }
}

public sealed record SummariesRequest(
    [Required,Length(1, 100)] HashSet<ulong> Ids,
    bool IncludeGames,
    string? Currency
);

public sealed record GamesRequest(
    [Required] ulong? SteamId,
    bool WithDetails,
    string? Currency
);