using Microsoft.AspNetCore.Mvc;
using SteamOrganizer.Server.Services.SteamParser;

namespace SteamOrganizer.Server.Controllers.Steam;

[Route(Defines.RoutePattern)]
public class TestController(SteamParser client)
{
    [HttpGet]
    public async Task Test()
    {
      
    }
}