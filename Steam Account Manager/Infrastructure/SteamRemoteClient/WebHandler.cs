using SteamKit2;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Net;
using System.Net.Cache;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web;

namespace Steam_Account_Manager.Infrastructure.SteamRemoteClient
{
    internal sealed class WebHandler
    {
        public static Uri SteamCommunityURL => new Uri("https://steamcommunity.com");
        public static Uri SteamHelpURL      => new Uri("https://help.steampowered.com");
        public static Uri SteamStoreURL     => new Uri("https://store.steampowered.com");

        public string Token { get; private set; }
        public string SessionID { get; private set; }
        public string TokenSecure { get; private set; }
        public ulong LastLogOnSteamID { get; private set; }
        private CookieContainer Cookies = new CookieContainer();

        internal async Task<string> Fetch(string url, string method, NameValueCollection data = null, bool ajax = true)
        {
            using (var response =  await Request(url, method, data, ajax))
            {
                if (response == null)
                    return null;

                using (Stream responseStream = response.GetResponseStream())
                {
                    // If the response stream is null it cannot be read. So return an empty string.
                    if (responseStream == null)
                        return null;
                    
                    using (StreamReader reader = new StreamReader(responseStream))
                    {
                        return reader.ReadToEnd();
                    }
                }
            }
        }
        public async Task<HttpWebResponse> Request(string url, string method, NameValueCollection data = null, bool ajax = true)
        {
            // Append the data to the URL for GET-requests.
            bool isGetMethod = (method.ToLower() == "get");
            string dataString = data == null ? null : String.Join("&", Array.ConvertAll(data.AllKeys, key =>
                string.Format("{0}={1}", HttpUtility.UrlEncode(key), HttpUtility.UrlEncode(data[key]))
            ));

            if (isGetMethod && !string.IsNullOrEmpty(dataString))
                url += (url.Contains("?") ? "&" : "?") + dataString;
            
            var request                                       = (HttpWebRequest)WebRequest.Create(url);
            request.Method                                    = method;
            request.Accept                                    = "application/json, text/javascript;q=0.9, */*;q=0.5";
            request.Headers[HttpRequestHeader.AcceptLanguage] = Thread.CurrentThread.CurrentCulture.TwoLetterISOLanguageName == "en" ? Thread.CurrentThread.CurrentCulture.ToString() + ",en;q=0.8" : Thread.CurrentThread.CurrentCulture.ToString() + "," + Thread.CurrentThread.CurrentCulture.TwoLetterISOLanguageName + ";q=0.8,en;q=0.6"; ;
            request.ContentType                               = "application/x-www-form-urlencoded; charset=UTF-8";
            request.UserAgent                                 = "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/31.0.1650.57 Safari/537.36";
            request.Timeout                                   = 50000; 
            request.CachePolicy                               = new HttpRequestCachePolicy(HttpRequestCacheLevel.Revalidate);
            request.AutomaticDecompression                    = DecompressionMethods.Deflate | DecompressionMethods.GZip;
            request.CookieContainer                           = Cookies;
            request.Referer                                   = "http://steamcommunity.com/trade/1";

            if (ajax)
            {
                request.Headers.Add("X-Requested-With", "XMLHttpRequest");
                request.Headers.Add("X-Prototype-Version", "1.7");
            }

            if (isGetMethod || string.IsNullOrEmpty(dataString))
            {
                try
                {
                    return await request.GetResponseAsync() as HttpWebResponse;
                }
                catch (WebException e)
                {
#if DEBUG
                    System.Windows.Forms.MessageBox.Show(e.ToString());
#endif
                    return null;
                }
            }

            byte[] dataBytes = Encoding.UTF8.GetBytes(dataString);
            request.ContentLength = dataBytes.Length;

            using (Stream requestStream = request.GetRequestStream())
            {
                requestStream.Write(dataBytes, 0, dataBytes.Length);
            }

            try
            {
                return request.GetResponse() as HttpWebResponse;
            }
            catch (WebException e)
            {
#if DEBUG
                System.Windows.Forms.MessageBox.Show(e.ToString());
#endif
                return null;
            }
        }

        public async Task<bool> Initialize(SteamClient client, string webAPIUserNonce)
        {
            LastLogOnSteamID = 0;
            if (string.IsNullOrEmpty(webAPIUserNonce) || client == null)
                return false;

            byte[] publicKey  = KeyDictionary.GetPublicKey(client.Universe);
            byte[] sessionKey = CryptoHelper.GenerateRandomBlock(32);
            byte[] rsaEncryptedSessionKey;

            using (var rsa = new RSACrypto(publicKey))
            {
                rsaEncryptedSessionKey = rsa.Encrypt(sessionKey);
            }

            byte[] loginKey          = Encoding.UTF8.GetBytes(webAPIUserNonce);
            byte[] encryptedLoginKey = CryptoHelper.SymmetricEncrypt(loginKey, sessionKey);

            KeyValue response;

            using (var iSteamUserAuth = WebAPI.GetAsyncInterface("ISteamUserAuth"))
            {
                 iSteamUserAuth.Timeout = TimeSpan.FromSeconds(100);

                try
                {
                    Dictionary<string, object> sessionArgs = new Dictionary<string, object>()
                    {
                        { "encrypted_loginkey", encryptedLoginKey },
                        { "sessionkey", rsaEncryptedSessionKey },
                        { "steamid", client.SteamID.ConvertToUInt64() }
                    };
                    response = await iSteamUserAuth.CallAsync(HttpMethod.Post, "AuthenticateUser", args: sessionArgs);
                }
                catch (Exception e)
                {
#if DEBUG
                    System.Windows.Forms.MessageBox.Show(e.ToString());
#endif
                    return false;
                }
            }

            if (response == null)
                return false;

            Token       = response["token"].AsString();
            TokenSecure = response["tokensecure"].AsString();

            if (string.IsNullOrEmpty(Token) || string.IsNullOrEmpty(TokenSecure))
                return false;

            SessionID = Convert.ToBase64String(Encoding.UTF8.GetBytes(client.SteamID.ConvertToUInt64().ToString(CultureInfo.InvariantCulture)));


            Cookies.Add(new Cookie("sessionid", SessionID, "/", $".{SteamCommunityURL.Host}"));
            Cookies.Add(new Cookie("sessionid", SessionID, "/", $".{SteamHelpURL.Host}"));
            Cookies.Add(new Cookie("sessionid", SessionID, "/", $".{SteamStoreURL.Host}"));

            Cookies.Add(new Cookie("steamLogin", Token, "/", $".{SteamCommunityURL.Host}"));
            Cookies.Add(new Cookie("steamLogin", Token, "/", $".{SteamHelpURL.Host}"));
            Cookies.Add(new Cookie("steamLogin", Token, "/", $".{SteamStoreURL.Host}"));

            Cookies.Add(new Cookie("steamLoginSecure", TokenSecure, "/", $".{SteamCommunityURL.Host}"));
            Cookies.Add(new Cookie("steamLoginSecure", TokenSecure, "/", $".{SteamHelpURL.Host}"));
            Cookies.Add(new Cookie("steamLoginSecure", TokenSecure, "/", $".{SteamStoreURL.Host}"));

            string timeZoneOffset = $"{(int)DateTimeOffset.Now.Offset.TotalSeconds}{Uri.EscapeDataString(",")}0";

            Cookies.Add(new Cookie("timezoneOffset", timeZoneOffset, "/", $".{SteamCommunityURL.Host}"));
            Cookies.Add(new Cookie("timezoneOffset", timeZoneOffset, "/", $".{SteamHelpURL.Host}"));
            Cookies.Add(new Cookie("timezoneOffset", timeZoneOffset, "/", $".{SteamStoreURL.Host}"));
            LastLogOnSteamID = client.SteamID.ConvertToUInt64();
            return true;
        }

    }
}
