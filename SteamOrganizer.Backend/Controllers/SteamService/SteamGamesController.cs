using Microsoft.AspNetCore.Mvc;
using SteamOrganizer.Backend.Core;
using SteamOrganizer.Backend.Parsers.SteamAPI;
using SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

namespace SteamOrganizer.Backend.Controllers.SteamService;

[ApiController]
[Route("SteamService/PlayerOwnedGames")]
public sealed class SteamGamesController : ControllerBase
{

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<PlayerOwnedGamesObject.OwnedGames?> GetAsync(ulong steamId, bool withDetails = false, string? cc = null)
    {
        var countryCode = cc ?? (withDetails ? await WebBrowser.GetCountryCodeByIp(Request.HttpContext.Connection.RemoteIpAddress).ConfigureAwait(false) : "us");
        var response = await SteamParser.ParseGames(steamId.ToString(), countryCode,HttpContext.RequestAborted, withDetails).ConfigureAwait(false);

        if (HttpContext.RequestAborted.IsCancellationRequested)
            return null;

        if (response == null)
        {
            BadRequest();
        }

        return response;
    }
}
