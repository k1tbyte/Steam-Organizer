using SteamOrganizer.Backend.Parsers.SteamAPI.Responses;
using System.Net;
using System.Text.Json;

namespace SteamOrganizer.Backend.Parsers.SteamAPI;

internal static class SteamParser
{

    private static readonly HttpClient HttpClient = new(new HttpClientHandler
    {
        AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip,
        AllowAutoRedirect = false,
    }, false)
    { DefaultRequestVersion = HttpVersion.Version30 };

    internal static string? ApiKey { get; set; }


    #region API requests

    internal static async Task<PlayerSummaries.Player[]?> GetPlayersSummaries(params ulong[] steamIds)
    {
        if (steamIds.Length > 100)
            throw new InvalidOperationException(nameof(steamIds));

        var response = await HttpClient.TryGetStringAsync(
            $"http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key={ApiKey}&steamids={string.Join(",", steamIds)}")
            .ConfigureAwait(false);

        return response == null ? null : JsonSerializer.Deserialize<PlayerSummaries>(response, App.DefaultJsonOptions)?.Response?.Players;
    }

    internal static async Task<int?> GetPlayerLevel(string steamId)
    {
        var response = await HttpClient.TryGetStringAsync(
            $"http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key={ApiKey}&steamid={steamId}")
            .ConfigureAwait(false);

        return response == null ? null : JsonSerializer.Deserialize<PlayerLevel>(response, App.DefaultJsonOptions).Response.Player_level;
    }

    #endregion
}