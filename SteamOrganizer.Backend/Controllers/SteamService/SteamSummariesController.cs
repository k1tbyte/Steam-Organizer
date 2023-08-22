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
    public async Task<PlayerSummariesObject.PlayerSummaries?> GetAsync(ulong steamid,bool includeGames = false)
    {
        var countryCode = includeGames ? await WebBrowser.GetCountryCodeByIp(Request.HttpContext.Connection.RemoteIpAddress).ConfigureAwait(false) : string.Empty;

        var response = await SteamParser.ParseInfo(steamid, includeGames, countryCode).ConfigureAwait(false);
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
    public async Task<Dictionary<string, PlayerSummariesObject.PlayerSummaries>?> PostAsync(ulong[] steamid,bool includeGames = false,string? cc = null)
    {
        var unique = steamid?.Distinct()?.ToArray();

        if (unique == null || !unique.Any())
        {
            BadRequest($"Invalid parameter {nameof(steamid)}");
            return null;
        }

        var countryCode = cc ?? (includeGames ? await WebBrowser.GetCountryCodeByIp(Request.HttpContext.Connection.RemoteIpAddress).ConfigureAwait(false) : string.Empty);
        var dictionary  = new Dictionary<string, PlayerSummariesObject.PlayerSummaries>(unique.Length);

        var result = await SteamParser.ParseInfo(unique, includeGames, countryCode,
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
        var unique = steamid?.Distinct()?.ToArray();

        if (unique == null || !unique.Any())
        {
            Results.BadRequest($"Invalid parameter {nameof(steamid)}");
            return;
        }

        var httpResponse         = HttpContext.Response;
        httpResponse.ContentType = "text/event-stream";
        var locker               = new object();
        var countryCode          = cc ?? (includeGames ? await WebBrowser.GetCountryCodeByIp(Request.HttpContext.Connection.RemoteIpAddress).ConfigureAwait(false) : string.Empty);

        var result = await SteamParser.ParseInfo(unique,includeGames, countryCode,
            (player) => 
        { 
            var jResponse = JsonSerializer.Serialize(player) + '\n'; 
            lock (locker) 
            { 
                httpResponse.WriteAsync(jResponse).Wait(); httpResponse.Body.Flush(); 
            } 
        }).ConfigureAwait(false);

        httpResponse.Body.Close();

        Ok();
    }
}
