using Microsoft.AspNetCore.Mvc;
using SteamOrganizer.Backend.Parsers.SteamAPI;
using SteamOrganizer.Backend.Parsers.SteamAPI.Responses;

namespace SteamOrganizer.Backend.Controllers.SteamService;

[ApiController]
[Route("SteamService/PlayerFriendList")]
public sealed class SteamFriendsController : ControllerBase
{
    [HttpGet]
    public async Task<PlayerFriendListObject.Friend[]?> GetAsync(ulong steamid)
    {
        var response = await SteamParser.ParseFriends(steamid).ConfigureAwait(false);
        if (response == null)
        {
            BadRequest();
        }

        return response;
    }
}
