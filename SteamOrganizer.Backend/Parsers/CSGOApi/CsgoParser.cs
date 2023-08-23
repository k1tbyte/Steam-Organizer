using Microsoft.AspNetCore.DataProtection.KeyManagement;
using SteamOrganizer.Backend.Core;
using SteamOrganizer.Backend.Parsers.CSGOStats.Responses;
using System.Text.Json;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using SteamOrganizer.Backend.Parsers.CSGOApi.Responses;

namespace SteamOrganizer.Backend.Parsers.CSGOStats;

public static class CsgoParser
{
    #region UrlConsts
    // Base
    public const string BaseUrl          = "https://open.faceit.com/data/v4";
    // Methods
    public const string PlayerUrl        = "players/"; //player info by player id
    public const string PlayerSteamIdUrl = "players?game=csgo&game_player_id=";//player info by steam id
    public const string NicknameUrl      = "players?nickname="; //player info by nickname
    public const string MatchUrl         = "matches/"; //match info by match id
    // parameters
    public const string StatsUrl         = "/stats/csgo"; //player info by nickname
    #endregion

    private static readonly HttpClient client = new();
    static CsgoParser()
    {
        client.BaseAddress = new Uri(BaseUrl);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", App.Config.GetValue<string>("Credentials:FaceitApiKey"));
    }

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

    public static async Task<(FaceitPlayerObject, FaceitPlayerStatsObject)> GetFaceitPlayerData(string parameter)
    {
        FaceitPlayerObject player = new FaceitPlayerObject();
        //parameter.Length==36 - for faceit id
        if (parameter.Length==19)
        {
            player = await GetPlayerBySteamId(parameter);
        }
        else
        {
            player = await GetPlayerByNickname(parameter);
        }
        return (player, await GetPlayerStatsById(player.player_id));
    }
    public static async Task<(FaceitMatchObject, IList<(FaceitPlayerObject, FaceitPlayerStatsObject)> team1, IList<(FaceitPlayerObject, FaceitPlayerStatsObject)> team2)> GetFaceitMatchInfoById(string match_id)
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
    }
    public static async Task<IList<(FaceitPlayerObject, FaceitPlayerStatsObject)>> GetFaceitStatsFromSteamStatus(string[] statusmsg)
    {
        IList<(FaceitPlayerObject, FaceitPlayerStatsObject)> players = new List<(FaceitPlayerObject, FaceitPlayerStatsObject)>();
        Parallel.ForEach(statusmsg, (msg) =>
        {
            if (msg == null)
                return;
            string[] subs = msg.Split(" ");
            try
            {
                var player = GetPlayerBySteamId(SteamIDToID64(subs[4]).ToString()).Result;
                player.steam_nickname = subs[3].Replace("\"", "");
                players.Add((player, GetPlayerStatsById(player.player_id).Result));
            }
            catch
            {
                players.Add((null, null));
            }
        });
        return players;
    }

    #region FaceitApiRequests
    private static async Task<string> GetAsync(string method, string parameters = "")
    {
        var str = $"{BaseUrl}/{method}{parameters}";
        var message = await client.GetAsync($"{BaseUrl}/{method}{parameters}");
        if (message.StatusCode == HttpStatusCode.OK)
        {
            return await message.Content.ReadAsStringAsync();
        }
        throw new FaceitApiException(await message.Content.ReadAsStringAsync());
    }

    private static async Task<FaceitPlayerObject> GetPlayerByNickname(string nickname)
    {

        var request = await GetAsync(NicknameUrl, nickname);
        return JsonSerializer.Deserialize<FaceitPlayerObject>(request);
    }
    private static async Task<FaceitPlayerObject> GetPlayerById(string id)
    {
        var request = await GetAsync(PlayerUrl, id);
        return JsonSerializer.Deserialize<FaceitPlayerObject>(request);
    }
    private static async Task<FaceitPlayerObject> GetPlayerBySteamId(string steamid)
    {
        var request = await GetAsync(PlayerSteamIdUrl, steamid);
        return JsonSerializer.Deserialize<FaceitPlayerObject>(request);
    }

    private static async Task<FaceitMatchObject> GetMatchById(string id)
    {
        var request = await GetAsync(MatchUrl, id);
        return JsonSerializer.Deserialize<FaceitMatchObject>(request);
    }
    private static async Task<FaceitPlayerStatsObject> GetPlayerStatsById(string id)
    {
        var request = await GetAsync(PlayerUrl + id, StatsUrl);
        return JsonSerializer.Deserialize<FaceitPlayerStatsObject>(request);
    }

    #endregion

    private static ulong SteamIDToID64(string steamID)
    {
        var chunks = steamID.Split(':');
        return (Convert.ToUInt64(chunks[2]) * 2) + 76561197960265728 + Convert.ToByte(chunks[1]);
    }
    public class FaceitApiException : Exception
    {
        public FaceitApiException(string message)
            : base(message)
        {
        }
    }
}
