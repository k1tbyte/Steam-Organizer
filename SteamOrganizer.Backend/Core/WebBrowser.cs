using System.Net;

namespace SteamOrganizer.Backend.Core;



internal static class WebBrowser
{
    public const int MaxAttempts        = 5;
    public const int RetryRequestDelay  = 5000;
    public const int MaxSteamHeaderSize = 7500;
    public static readonly int MaxDegreeOfParallelism =
#if DEBUG
        Environment.ProcessorCount;
#else
        Environment.ProcessorCount * 4;
#endif

    private static readonly HttpClient HttpClient = new(new HttpClientHandler
    {
        AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip,
        AllowAutoRedirect = false,
    }, false)
    { DefaultRequestVersion = HttpVersion.Version30 };

    public static async Task<string?> GetStringAsync(string url)
    {
        try
        {
            using var response = await HttpClient.GetAsync(url).ConfigureAwait(false);
            return await response?.Content?.ReadAsStringAsync()!;

        }
        catch 
        { 
            //LOG
        }
        return null;
    }

    public static async Task<string> GetCountryCodeByIp(IPAddress? address)
    {
        var response = await GetStringAsync($"http://ip-api.com/json/{address}");
        if (response == null)
            return "us";

        return System.Text.Json.JsonSerializer.Deserialize<IpInfoObject>(response, App.DefaultJsonOptions)?.CountryCode ?? "us";
    }


    private sealed class IpInfoObject
    {
        public required string Country { get; set; }
        public required string CountryCode { get; set; }
    }
}
