using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using SteamOrganizer.Server.Filters;
using SteamOrganizer.Server.Lib;
using SteamOrganizer.Server.Lib.JsonConverters;
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
        return await parser.GetFriendsInfo(Tools.ToSteamId64(steamId!.Value));
    }
}

public sealed class SummariesRequest
{
    [Required, Length(1, 100), JsonConverter(typeof(SteamIdSetConverter))] 
    public required HashSet<ulong> Ids { get; init; }
    public bool IncludeGames { get; init; }
    public string? Currency { get; init; }
}

public sealed class GamesRequest
{
    [Required,JsonConverter(typeof(SteamIdConverter))] 
    public ulong? SteamId { get; init; }
    public bool WithDetails { get; init; }
    public string? Currency { get; init; }
}