using SteamOrganizer.Backend.Core;
using SteamOrganizer.Backend.Parsers.CSGOStats.Responses;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace SteamOrganizer.Backend.Parsers.CSGOStats;

public static class CsgoParser
{

    public static async Task<MatchmakingStatsObject?> GetMatchmakingStats(string steamid)
    {
        try
        {
            var response = await WebBrowser.GetStringAsync($"https://csgostats.gg/player/{steamid}");
            if (response == null)
                return null;

            var match = Regexes.CsgoStatsJson().Match(response)?.Value;
            if (match == null)
                return null;

            match.InjectionReplace(0, ' ', '{').InjectionReplace(match.Length - 1, ' ', '\0');

            return JsonSerializer.Deserialize<MatchmakingStatsObject>(match, App.DefaultJsonOptions);
        }
        catch
        {
            return null;
        }
    }
}
