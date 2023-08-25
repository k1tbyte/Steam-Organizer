using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
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
        var countryCode = cc ?? ( withDetails ? await WebBrowser.GetCountryCodeByIp(Request.HttpContext.Connection.RemoteIpAddress).ConfigureAwait(false) : string.Empty);
        var response = await SteamParser.ParseGames(steamId.ToString(), countryCode, withDetails).ConfigureAwait(false);
        if (response == null)
        {
            BadRequest();
        }

        return response;
    }
}
