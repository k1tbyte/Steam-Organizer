using Newtonsoft.Json;
using System;
using System.Collections.Specialized;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Threading;

namespace Checker;
public static class APIEndpoints
{
    public const string STEAMAPI_BASE = "https://api.steampowered.com";
    public const string COMMUNITY_BASE = "https://steamcommunity.com";
    public const string MOBILEAUTH_BASE = STEAMAPI_BASE + "/IMobileAuthService/%s/v0001";
    public static string MOBILEAUTH_GETWGTOKEN = MOBILEAUTH_BASE.Replace("%s", "GetWGToken");
    public const string TWO_FACTOR_BASE = STEAMAPI_BASE + "/ITwoFactorService/%s/v0001";
    public static string TWO_FACTOR_TIME_QUERY = TWO_FACTOR_BASE.Replace("%s", "QueryTime");
}

public class Util
{
    public static long GetSystemUnixTime()
    {
        return (long)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
    }
    public static byte[] HexStringToByteArray(string hex)
    {
        int hexLen = hex.Length;
        byte[] ret = new byte[hexLen / 2];
        for (int i = 0; i < hexLen; i += 2)
        {
            ret[i / 2] = Convert.ToByte(hex.Substring(i, 2), 16);
        }
        return ret;
    }
}

public class TimeAligner
{
    private static bool _aligned = false;
    private static int _timeDifference = 0;

    public static long GetSteamTime()
    {
        if (!TimeAligner._aligned)
        {
            TimeAligner.AlignTime();
        }
        return Util.GetSystemUnixTime() + _timeDifference;
    }

    public static async Task<long> GetSteamTimeAsync()
    {
        if (!TimeAligner._aligned)
        {
            await TimeAligner.AlignTimeAsync();
        }
        return Util.GetSystemUnixTime() + _timeDifference;
    }

    public static void AlignTime()
    {
        long currentTime = Util.GetSystemUnixTime();
        using (WebClient client = new WebClient())
        {
            try
            {
                string response = client.UploadString(APIEndpoints.TWO_FACTOR_TIME_QUERY, "steamid=0");
                TimeQuery query = JsonConvert.DeserializeObject<TimeQuery>(response);
                TimeAligner._timeDifference = (int)(query.Response.ServerTime - currentTime);
                TimeAligner._aligned = true;
            }
            catch (WebException)
            {
                return;
            }
        }
    }

    public static async Task AlignTimeAsync()
    {
        long currentTime = Util.GetSystemUnixTime();
        WebClient client = new WebClient();
        try
        {
            string response = await client.UploadStringTaskAsync(new Uri(APIEndpoints.TWO_FACTOR_TIME_QUERY), "steamid=0");
            TimeQuery query = JsonConvert.DeserializeObject<TimeQuery>(response);
            TimeAligner._timeDifference = (int)(query.Response.ServerTime - currentTime);
            TimeAligner._aligned = true;
        }
        catch (WebException)
        {
            return;
        }
    }

    internal class TimeQuery
    {
        [JsonProperty("response")]
        internal TimeQueryResponse Response { get; set; }

        internal class TimeQueryResponse
        {
            [JsonProperty("server_time")]
            public long ServerTime { get; set; }
        }

    }
}

class SteamClient
{
    private static readonly CookieContainer _cookies = new();

    public static string MobileLoginRequest(string url, string method, NameValueCollection data = null, CookieContainer cookies = null, NameValueCollection headers = null)
    {
        return Request(url, method, data, cookies, headers, APIEndpoints.COMMUNITY_BASE + "/mobilelogin?oauth_client_id=DE45CD61&oauth_scope=read_profile%20write_profile%20read_client%20write_client");
    }

    public static string Request(string url, string method, NameValueCollection data = null, CookieContainer cookies = null, NameValueCollection headers = null, string referer = APIEndpoints.COMMUNITY_BASE)
    {
        string query = (data == null ? string.Empty : string.Join("&", Array.ConvertAll(data.AllKeys, key => String.Format("{0}={1}", WebUtility.UrlEncode(key), WebUtility.UrlEncode(data[key])))));
        if (method == "GET")
        {
            url += (url.Contains("?") ? "&" : "?") + query;
        }

        return Request(url, method, query, cookies, headers, referer);
    }

    public static string Request(string url, string method, string dataString = null, CookieContainer cookies = null, NameValueCollection headers = null, string referer = APIEndpoints.COMMUNITY_BASE)
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

    private static void HandleFailedWebRequestResponse(HttpWebResponse response, string requestURL)
    {
        if (response == null) return;

        //Redirecting -- likely to a steammobile:// URI
        if (response.StatusCode == HttpStatusCode.Found)
        {
            var location = response.Headers.Get("Location");
            if (!string.IsNullOrEmpty(location))
            {
                //Our OAuth token has expired. This is given both when we must refresh our session, or the entire OAuth Token cannot be refreshed anymore.
                //Thus, we should only throw this exception when we're attempting to refresh our session.
                if (location == "steammobile://lostauth" && requestURL == APIEndpoints.MOBILEAUTH_GETWGTOKEN)
                {
                    throw new Exception();
                }
            }
        }
    }
    private class RSAResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("publickey_exp")]
        public string Exponent { get; set; }

        [JsonProperty("publickey_mod")]
        public string Modulus { get; set; }

        [JsonProperty("timestamp")]
        public string Timestamp { get; set; }

        [JsonProperty("steamid")]
        public ulong SteamID { get; set; }
    }

    private class LoginResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("login_complete")]
        public bool LoginComplete { get; set; }

        [JsonProperty("oauth")]
        public string OAuthDataString { get; set; }

        public OAuth OAuthData
        {
            get
            {
                return OAuthDataString != null ? JsonConvert.DeserializeObject<OAuth>(OAuthDataString) : null;
            }
        }

        [JsonProperty("captcha_needed")]
        public bool CaptchaNeeded { get; set; }

        [JsonProperty("captcha_gid")]
        public string CaptchaGID { get; set; }

        [JsonProperty("emailsteamid")]
        public ulong EmailSteamID { get; set; }

        [JsonProperty("emailauth_needed")]
        public bool EmailAuthNeeded { get; set; }

        [JsonProperty("requires_twofactor")]
        public bool TwoFactorNeeded { get; set; }

        [JsonProperty("message")]
        public string Message { get; set; }

        internal class OAuth
        {
            [JsonProperty("steamid")]
            public ulong SteamID { get; set; }

            [JsonProperty("oauth_token")]
            public string OAuthToken { get; set; }

            [JsonProperty("wgtoken")]
            public string SteamLogin { get; set; }

            [JsonProperty("wgtoken_secure")]
            public string SteamLoginSecure { get; set; }

            [JsonProperty("webcookie")]
            public string Webcookie { get; set; }
        }
    }

    public static bool RequiresCaptcha;
    public static string CaptchaGID = null;
    public static string CaptchaText = null;

    public static bool RequiresEmail;
    public static string EmailDomain = null;
    public static string EmailCode = null;

    public static bool Requires2FA;
    public string TwoFactorCode = null;

    public static bool LoggedIn = false;

    public static string DoLogin(string Username, string Password)
    {
        var postData = new NameValueCollection();
        var cookies = _cookies;
        string response = null;

        if (cookies.Count == 0)
        {
            cookies.Add(new Cookie("mobileClientVersion", "0 (2.1.3)", "/", ".steamcommunity.com"));
            cookies.Add(new Cookie("mobileClient", "android", "/", ".steamcommunity.com"));
            cookies.Add(new Cookie("Steam_Language", "english", "/", ".steamcommunity.com"));

            NameValueCollection headers = new NameValueCollection();
            headers.Add("X-Requested-With", "com.valvesoftware.android.steam.community");
            MobileLoginRequest("https://steamcommunity.com/login?oauth_client_id=DE45CD61&oauth_scope=read_profile%20write_profile%20read_client%20write_client", "GET", null, cookies, headers);
        }

        postData.Add("donotcache", (TimeAligner.GetSteamTime() * 1000).ToString());
        postData.Add("username", Username);
        response = MobileLoginRequest(APIEndpoints.COMMUNITY_BASE + "/login/getrsakey", "POST", postData, cookies);
        if (response == null || response.Contains("<BODY>\nAn error occurred while processing your request.")) return "General fail";

        var rsaResponse = JsonConvert.DeserializeObject<RSAResponse>(response);

        if (!rsaResponse.Success)
        {
            return "Error, bad RSA";
        }

        Thread.Sleep(350);

        RNGCryptoServiceProvider secureRandom = new RNGCryptoServiceProvider();
        byte[] encryptedPasswordBytes;
        using (var rsaEncryptor = new RSACryptoServiceProvider())
        {
            var passwordBytes = Encoding.ASCII.GetBytes(Password);
            var rsaParameters = rsaEncryptor.ExportParameters(false);
            rsaParameters.Exponent = Util.HexStringToByteArray(rsaResponse.Exponent);
            rsaParameters.Modulus = Util.HexStringToByteArray(rsaResponse.Modulus);
            rsaEncryptor.ImportParameters(rsaParameters);
            encryptedPasswordBytes = rsaEncryptor.Encrypt(passwordBytes, false);
        }

        string encryptedPassword = Convert.ToBase64String(encryptedPasswordBytes);

        postData.Clear();
        postData.Add("donotcache", (TimeAligner.GetSteamTime() * 1000).ToString());

        postData.Add("password", encryptedPassword);
        postData.Add("username", Username);

        postData.Add("loginfriendlyname", "");

        postData.Add("rsatimestamp", rsaResponse.Timestamp);
        postData.Add("remember_login", "true");
        postData.Add("oauth_client_id", "DE45CD61");
        postData.Add("oauth_scope", "read_profile write_profile read_client write_client");

        response = MobileLoginRequest(APIEndpoints.COMMUNITY_BASE + "/login/dologin", "POST", postData, cookies);
        if (response == null) return "General fail";

        var loginResponse = JsonConvert.DeserializeObject<LoginResponse>(response);

        if (loginResponse.Message != null)
        {
            if (loginResponse.Message.Contains("There have been too many login failures"))
                return "TooManyFailedLogins";

            if (loginResponse.Message.Contains("Incorrect login"))
                return "BadCredentials";
        }

        if (loginResponse.CaptchaNeeded)
        {
            CaptchaGID = loginResponse.CaptchaGID;
            return "NeedCaptcha";
        }

        if (loginResponse.EmailAuthNeeded)
        {
            RequiresEmail = true;
            return "need mail";
        }

        if (loginResponse.TwoFactorNeeded && !loginResponse.Success)
        {
            Requires2FA = true;
            return "Need2FA";
        }

        if (loginResponse.OAuthData == null || loginResponse.OAuthData.OAuthToken == null || loginResponse.OAuthData.OAuthToken.Length == 0)
        {
            return "GeneralFailure";
        }

        if (!loginResponse.LoginComplete)
        {
            return "BadCredentials";
        }
        else
        {
            return "loginOkay";
        }

    }

    static void Main()
    {
        Console.WriteLine(DoLogin("sheppardb7", "benjamin990"));
        Console.ReadKey();
    }
}