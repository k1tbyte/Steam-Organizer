using SteamOrganizer.Backend.Core;
using SteamOrganizer.Backend.Parsers.CSGOApi.Responses;
using System.Net;
using System.Text.Json;

namespace SteamOrganizer.Backend.Parsers.CSGOApi;

public static class CsgoParser
{
    public const string FaceitAPIUrl          = "https://open.faceit.com/data/v4/";

    private static readonly string FaceitApiKey = App.Config.GetValue<string>("Credentials:FaceitApiKey")!;

    public static async Task<MatchmakingStatsObject?> GetMatchmakingStats(string steamid)
    {
        try
        {
            if (App.Cache.GetCachedData<MatchmakingStatsObject>($"csM_{steamid}", out var cache))
            {
                return cache;
            }

            var response = await WebBrowser.GetStringAsync($"https://csgostats.gg/player/{steamid}");
            if (response == null)
                return null;


            var match = Regexes.CsgoStatsJson().Match(response)?.Value;
            if (match == null)
                return null;

            match.InjectionReplace(0, ' ', '{').InjectionReplace(match.Length - 1, ' ', '\0');
            var obj = JsonSerializer.Deserialize<MatchmakingStatsObject>(match, App.DefaultJsonOptions);

            if(obj != null)
            {
                App.Cache.SetCachedData($"csM_{steamid}", obj, TimeSpan.FromHours(6));
            }


            return obj;
        }
        catch
        {
            return null;
        }
    }

    public static async Task<FaceitStatsObject?> GetFaceitStats(string steamid)
    {
        var response = await WebBrowser.GetStringAsync(
            $"{FaceitAPIUrl}players?game=csgo&game_player_id={steamid}",FaceitApiKey).ConfigureAwait(false);

        if(!IsValid())
            return null;
        
        var player = JsonSerializer.Deserialize<FaceitPlayerObject>(response.Item1!,App.DefaultJsonOptions);

        if (player?.Games?.Csgo == null)
            return null;

        response = await WebBrowser.GetStringAsync(
            $"{FaceitAPIUrl}players/{player!.FaceitID}/stats/csgo", FaceitApiKey).ConfigureAwait(false);

        if (!IsValid())
            return null;

        var stats = JsonSerializer.Deserialize<FaceitPlayerStatsObject>(response.Item1!, App.DefaultJsonOptions);

        //downcast :p
        FaceitStatsObject result  = JsonSerializer.Deserialize<FaceitStatsObject>(JsonSerializer.Serialize(stats!.OverallStats!))!;
        result.Elo                = player.Games.Csgo.Faceit_elo;
        result.SkillLevel         = player.Games.Csgo.Skill_level;
        result.Maps               = stats.Maps;

        return result;

        bool IsValid() => response.Item2 == HttpStatusCode.OK && !string.IsNullOrEmpty(response.Item1);
    }

/*    public static async Task<(FaceitMatchObject, IList<(FaceitPlayerObject, FaceitPlayerStatsObject)> team1, IList<(FaceitPlayerObject, FaceitPlayerStatsObject)> team2)> GetFaceitMatchInfoById(string match_id)
    {
        FaceitMatchObject match = await GetMatchById(match_id);
        IList<(FaceitPlayerObject, FaceitPlayerStatsObject)> team1 = new List<(FaceitPlayerObject, FaceitPlayerStatsObject)>();
        IList<(FaceitPlayerObject, FaceitPlayerStatsObject)> team2 = new List<(FaceitPlayerObject, FaceitPlayerStatsObject)>();
        Parallel.ForEach(match.teams.faction1.roster, (pid) =>
        {
            team1.Add((GetPlayerById(pid.player_id).Result, GetPlayerStatsById(pid.player_id).Result));
        });
        Parallel.ForEach(match.teams.faction2.roster, (pid) =>
        {
            team2.Add((GetPlayerById(pid.player_id).Result, GetPlayerStatsById(pid.player_id).Result));
        });
        return (match, team1, team2);
    }*/
}
