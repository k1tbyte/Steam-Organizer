using System;
using System.Collections.Specialized;
using System.IO;
using System.Net;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator
{
    public class SteamWeb
    {
        public static readonly string STEAMAPI_BASE = "https://api.steampowered.com";
        public const string COMMUNITY_BASE = "https://steamcommunity.com";
        public static readonly string MOBILEAUTH_BASE = STEAMAPI_BASE + "/IMobileAuthService/%s/v0001";
        public static readonly string MOBILEAUTH_GETWGTOKEN = MOBILEAUTH_BASE.Replace("%s", "GetWGToken");
        public static readonly string TWO_FACTOR_BASE = STEAMAPI_BASE + "/ITwoFactorService/%s/v0001";
        public static readonly string TWO_FACTOR_TIME_QUERY = TWO_FACTOR_BASE.Replace("%s", "QueryTime");


        public static string MobileLoginRequest(string url, string method, NameValueCollection data = null, CookieContainer cookies = null, NameValueCollection headers = null)
        {
            return Request(url, method, data, cookies, headers, COMMUNITY_BASE + "/mobilelogin?oauth_client_id=DE45CD61&oauth_scope=read_profile%20write_profile%20read_client%20write_client");
        }

        public static string Request(string url, string method, NameValueCollection data = null, CookieContainer cookies = null, NameValueCollection headers = null, string referer = COMMUNITY_BASE)
        {
            string query = (data == null ? string.Empty : string.Join("&", Array.ConvertAll(data.AllKeys, key => String.Format("{0}={1}", WebUtility.UrlEncode(key), WebUtility.UrlEncode(data[key])))));
            if (method == "GET")
            {
                url += (url.Contains("?") ? "&" : "?") + query;
            }

            return Request(url, method, query, cookies, headers, referer);
        }

        public static string Request(string url, string method, string dataString = null, CookieContainer cookies = null, NameValueCollection headers = null, string referer = COMMUNITY_BASE)
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = method;
            request.Accept = "text/javascript, text/html, application/xml, text/xml, */*";
            request.UserAgent = "Mozilla/5.0 (Linux; U; Android 4.1.1; en-us; Google Nexus 4 - 4.1.1 - API 16 - 768x1280 Build/JRO03S) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30";
            request.AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip;
            request.Referer = referer;

            if (headers != null)
            {
                request.Headers.Add(headers);
            }

            if (cookies != null)
            {
                request.CookieContainer = cookies;
            }

            if (method == "POST")
            {
                request.ContentType = "application/x-www-form-urlencoded; charset=UTF-8";
                request.ContentLength = dataString.Length;

                StreamWriter requestStream = new StreamWriter(request.GetRequestStream());
                requestStream.Write(dataString);
                requestStream.Close();
            }

            try
            {
                using (HttpWebResponse response = (HttpWebResponse)request.GetResponse())
                {
                    if (response.StatusCode != HttpStatusCode.OK)
                    {
                        HandleFailedWebRequestResponse(response, url);
                        return null;
                    }

                    using (StreamReader responseStream = new StreamReader(response.GetResponseStream()))
                    {
                        string responseData = responseStream.ReadToEnd();
                        return responseData;
                    }
                }
            }
            catch (WebException e)
            {
                HandleFailedWebRequestResponse(e.Response as HttpWebResponse, url);
                return null;
            }
        }

        public static async Task<string> RequestAsync(string url, string method, NameValueCollection data = null, CookieContainer cookies = null, NameValueCollection headers = null, string referer = COMMUNITY_BASE)
        {
            string query = (data == null ? string.Empty : string.Join("&", Array.ConvertAll(data.AllKeys, key => String.Format("{0}={1}", WebUtility.UrlEncode(key), WebUtility.UrlEncode(data[key])))));
            if (method == "GET")
            {
                url += (url.Contains("?") ? "&" : "?") + query;
            }

            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = method;
            request.Accept = "text/javascript, text/html, application/xml, text/xml, */*";
            request.UserAgent = "Mozilla/5.0 (Linux; U; Android 4.1.1; en-us; Google Nexus 4 - 4.1.1 - API 16 - 768x1280 Build/JRO03S) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30";
            request.AutomaticDecompression = DecompressionMethods.Deflate | DecompressionMethods.GZip;
            request.Referer = referer;

            if (headers != null)
            {
                request.Headers.Add(headers);
            }

            if (cookies != null)
            {
                request.CookieContainer = cookies;
            }

            if (method == "POST")
            {
                request.ContentType = "application/x-www-form-urlencoded; charset=UTF-8";
                request.ContentLength = query.Length;

                StreamWriter requestStream = new StreamWriter(request.GetRequestStream());
                await requestStream.WriteAsync(query);
                requestStream.Close();
            }

            try
            {
                HttpWebResponse response = (HttpWebResponse)await request.GetResponseAsync();

                if (response.StatusCode != HttpStatusCode.OK)
                {
                    HandleFailedWebRequestResponse(response, url);
                    return null;
                }

                using (StreamReader responseStream = new StreamReader(response.GetResponseStream()))
                {
                    string responseData = await responseStream.ReadToEndAsync();
                    return responseData;
                }
            }
            catch (WebException e)
            {
                HandleFailedWebRequestResponse(e.Response as HttpWebResponse, url);
                return null;
            }
        }

        private static void HandleFailedWebRequestResponse(HttpWebResponse response, string requestURL)
        {
            if (response == null) return;

            if (response.StatusCode == HttpStatusCode.Found)
            {
                var location = response.Headers.Get("Location");
                if (!string.IsNullOrEmpty(location))
                {
                    if (location == "steammobile://lostauth" && requestURL == MOBILEAUTH_GETWGTOKEN)
                    {
                        throw new SteamGuardAccount.WGTokenExpiredException();
                    }
                }
            }
        }
    }
}
