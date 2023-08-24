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

    static WebBrowser()
    {
        HttpClient.DefaultRequestHeaders.Add("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9");
        HttpClient.DefaultRequestHeaders.Add("accept-language", "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7");
        HttpClient.DefaultRequestHeaders.Add("cache-control", "max-age=0");
        HttpClient.DefaultRequestHeaders.Add("sec-ch-ua", "\" Not A; Brand \";v=\"99\", \"Chromium \";v=\"101\", \"Google Chrome\";v=\"101\"");
        HttpClient.DefaultRequestHeaders.Add("sec-ch-ua-mobile", "?0");
        HttpClient.DefaultRequestHeaders.Add("sec-ch-ua-platform", "\"Windows\"");
        HttpClient.DefaultRequestHeaders.Add("sec-fetch-dest", "document");
        HttpClient.DefaultRequestHeaders.Add("sec-fetch-mode", "navigate");
        HttpClient.DefaultRequestHeaders.Add("sec-fetch-site", "same-origin");
        HttpClient.DefaultRequestHeaders.Add("sec-fetch-user", "?1");
        HttpClient.DefaultRequestHeaders.Add("upgrade-insecure-requests", "1");
        HttpClient.DefaultRequestHeaders.Add("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36");
    }

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

    public static async Task<(string?,HttpStatusCode)> GetStringAsync(string url, string authToken)
    {
        using var request             = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", authToken);
        using var response            = await HttpClient.SendAsync(request).ConfigureAwait(false);

        return (await response.Content.ReadAsStringAsync().ConfigureAwait(false), response.StatusCode);
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
