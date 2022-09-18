namespace Steam_Account_Manager.Infrastructure.Models
{
    public class GetRsaKey
    {
        public bool success { get; set; }
        public string publickey_mod { get; set; }
        public string publickey_exp { get; set; }
        public string timestamp { get; set; }
    }

    public class SteamResult
    {
        public bool success { get; set; }
        public string message { get; set; }
        public bool captcha_needed { get; set; }
        public string captcha_gid { get; set; }
        public bool emailauth_needed { get; set; }
        public string emailsteamid { get; set; }
    }
}
