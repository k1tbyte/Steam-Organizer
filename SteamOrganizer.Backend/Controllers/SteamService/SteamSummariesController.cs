using Microsoft.AspNetCore.Mvc;
using SteamOrganizer.Backend.Core;
using SteamOrganizer.Backend.Parsers.SteamAPI;
using SteamOrganizer.Backend.Parsers.SteamAPI.Responses;
using System.Text.Json;

namespace SteamOrganizer.Backend.Controllers.SteamService;

[ApiController]
[Route("SteamService/PlayerSummaries")]
public sealed class SteamSummariesController : ControllerBase
{

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<SteamSummariesObject.SteamSummaries?> GetAsync(ulong steamid,bool includeGames = false)
    {
        var countryCode = includeGames ? await WebBrowser.GetCountryCodeByIp(Request.HttpContext.Connection.RemoteIpAddress).ConfigureAwait(false) : string.Empty;

        var response = await SteamParser.ParseInfo(steamid, includeGames, countryCode, HttpContext.RequestAborted).ConfigureAwait(false);
        if(response == null)
        {
            BadRequest();
            return null;
        }

        return response;
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<Dictionary<string, SteamSummariesObject.SteamSummaries>?> PostAsync(ulong[] steamid,bool includeGames = false,string? cc = null)
    {
        var unique = steamid?.Distinct()?.ToArray();

        if (unique == null || !unique.Any())
        {
            BadRequest($"Invalid parameter {nameof(steamid)}");
            return null;
        }

        var countryCode = cc ?? (includeGames ? await WebBrowser.GetCountryCodeByIp(Request.HttpContext.Connection.RemoteIpAddress).ConfigureAwait(false) : string.Empty);
        var dictionary  = new Dictionary<string, SteamSummariesObject.SteamSummaries>(unique.Length);

        var result = await SteamParser.ParseInfo(unique, includeGames, countryCode, HttpContext.RequestAborted,
            (player) => dictionary.Add(player.SteamID, player)).ConfigureAwait(false);

        if (result != ESteamApiResult.OK)
        {
            Results.Problem(result.ToString(), statusCode: 500);
        }

        return dictionary;
    }

    [HttpPost("Stream")]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task PostAsyncStream(ulong[] steamid,bool includeGames = false, string? cc = null)
    {
        var httpResponse = HttpContext.Response;
        httpResponse.ContentType = "text/event-stream";

        var unique = steamid?.Distinct()?.ToArray();

        if (unique == null || !unique.Any())
        {
            Results.BadRequest($"Invalid parameter {nameof(steamid)}");
            return;
        }

        var locker               = new object();
        var countryCode          = cc ?? (includeGames ? await WebBrowser.GetCountryCodeByIp(Request.HttpContext.Connection.RemoteIpAddress).ConfigureAwait(false) : string.Empty);

        var result = await SteamParser.ParseInfo(unique,includeGames, countryCode, HttpContext.RequestAborted,
            (player) => 
        {
            Console.WriteLine(player.SteamID);

            var jResponse = JsonSerializer.Serialize(player) + '\n'; 
            lock (locker) 
            { 
                httpResponse.WriteAsync(jResponse).Wait(); 
                httpResponse.Body.Flush(); 
            } 
        });

        httpResponse.Body.Close();

        if (result == ESteamApiResult.OK)
        {
            Ok();
        }
    }
}
