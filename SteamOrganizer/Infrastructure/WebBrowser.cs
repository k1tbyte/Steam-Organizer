using SteamOrganizer.MVVM.View.Extensions;
using System;
using System.Net;
using System.Net.Http;
using System.Net.NetworkInformation;
using System.Threading.Tasks;

namespace SteamOrganizer.Infrastructure
{
    internal sealed class WebBrowser : IDisposable
    {
        internal static bool IsNetworkAvailable { get; private set; }

        internal const string SteamAvatarsHost  = "https://avatars.cloudflare.steamstatic.com/";
        internal const string SteamProfilesHost = "https://steamcommunity.com/profiles/";
        internal const string SteamHost         = "https://steamcommunity.com/";

        internal const byte MaxConnections        = 5;
        internal const byte MaxAttempts           = 5;
        internal const int MaxSteamHeaderSize     = 7500; //8 kibibyte  = 8192 (reserve for other headers)

        /// <summary>
        /// Time in ms
        /// </summary>
        internal const int RetryRequestDelay      = 5000;

        private readonly HttpClient HttpClient;
        private readonly HttpClientHandler HttpClientHandler;

        internal HttpStatusCode? LastStatusCode { get; private set; } = null;
        internal static event Action OnNetworkConnection;
        internal static event Action OnNetworkDisconnection;

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
            OnNetworkStateChanged(null, null);
            NetworkChange.NetworkAddressChanged += OnNetworkStateChanged;

        }

        private static void OnNetworkStateChanged(object sender, EventArgs e)
        {
            var _isAvailable = CheckInternetConnection();
            if (_isAvailable == IsNetworkAvailable)
            {
                return;
            }

            IsNetworkAvailable = _isAvailable;
            if(_isAvailable)
            {
                OnNetworkConnection?.Invoke();
                return;
            }

            OnNetworkDisconnection?.Invoke();
        }

        internal static bool CheckInternetConnection()
        {
            try
            {
                Dns.GetHostEntry("google.com");
                return true;
            }
            catch
            {
                return false;
            }
        }

        internal void OpenNeedConnectionPopup()
        {
            if (!IsNetworkAvailable)
            {
                PushNotification.Open("This action requires an Internet connection", type: PushNotification.EPushNotificationType.Warn);
                return;
            }
        }

        public void Dispose()
        {
            HttpClientHandler.Dispose();
            HttpClient.Dispose();
            NetworkChange.NetworkAddressChanged -= OnNetworkStateChanged;
        }

        private async Task<HttpResponseMessage> GetAsync(string url)
        {
            if (!IsNetworkAvailable)
            {
                LastStatusCode = HttpStatusCode.RequestTimeout;
                return null;
            }
                

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
                    return await response?.Content?.ReadAsStringAsync();
                }
                    
            }
            catch (Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }
            return null;
        }

        public async Task<HttpResponseMessage> SendRequestAsync(HttpRequestMessage request, HttpCompletionOption options)
        {
            try
            {
                return await HttpClient.SendAsync(request, options).ConfigureAwait(false);
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
                if (!IsNetworkAvailable)
                {
                    LastStatusCode = HttpStatusCode.RequestTimeout;
                    return null;
                }

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
