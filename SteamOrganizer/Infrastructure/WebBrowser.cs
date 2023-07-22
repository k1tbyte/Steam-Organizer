using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace SteamOrganizer.Infrastructure
{
    internal sealed class WebBrowser : IDisposable
    {
        internal const string SteamAvatarsHost  = "https://avatars.cloudflare.steamstatic.com/";
        internal const string SteamProfilesHost = "https://steamcommunity.com/profiles/";
        internal const string SteamHost         = "https://steamcommunity.com/";

        internal const byte MaxConnections        = 5;
        internal const byte MaxAttempts           = 5;

        /// <summary>
        /// Time in ms
        /// </summary>
        internal const int RetryRequestDelay      = 5000;

        private readonly HttpClient HttpClient;
        private readonly HttpClientHandler HttpClientHandler;

        internal HttpStatusCode? LastStatusCode { get; private set; } = null;

        public WebBrowser()
        {
            HttpClientHandler = new HttpClientHandler
            {
                AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip,
                AllowAutoRedirect = false,
                MaxConnectionsPerServer = MaxConnections
            };

            HttpClient = new HttpClient(HttpClientHandler, false);
            HttpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36");
            HttpClient.DefaultRequestHeaders.AcceptEncoding.ParseAdd("gzip, deflate");
            HttpClient.DefaultRequestHeaders.AcceptLanguage.ParseAdd("en-US,en;q=0.9");
            HttpClient.DefaultRequestHeaders.Accept.ParseAdd("text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9");
            HttpClient.DefaultRequestHeaders.Add("Connection", "Keep-Alive");

        }

        public void Dispose()
        {
            HttpClientHandler.Dispose();
            HttpClient.Dispose();
        }

        private async Task<HttpResponseMessage> GetAsync(string url)
        {
            var response = await HttpClient.GetAsync(url).ConfigureAwait(false);
            LastStatusCode = response.StatusCode;
            return response;
        }

        public async Task<string> GetStringAsync(string url)
        {
            try
            {
                using (var response = await GetAsync(url).ConfigureAwait(false))
                {
                    return await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                }
                    
            }
            catch (Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }
            return null;
        }

        public async Task<string> PostStringAsync(string url, string content)
        {
            try
            {
                return await (await HttpClient.PostAsync(url, new StringContent(content))).Content.ReadAsStringAsync();
            }
            catch(Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }
            return null;
        }
        
    }
}
