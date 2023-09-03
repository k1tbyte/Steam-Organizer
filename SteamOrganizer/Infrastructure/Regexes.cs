using System.Text.RegularExpressions;

namespace SteamOrganizer.Infrastructure
{
    internal static class Regexes
    {
        internal static readonly Regex AvatarHashXml = new Regex("(?<=https:\\/\\/avatars\\.akamai\\.steamstatic\\.com\\/)[a-zA-Z0-9]+");
        internal static readonly Regex NicknameXml   = new Regex("(?<=<steamID><!\\[CDATA\\[).*?(?=\\]\\]>)");
        internal static readonly Regex SteamId64Xml  = new Regex("(?<=<steamID64>).*?(?=</steamID64>)");
        internal static readonly Regex AppVersion    = new Regex("(?<=assembly: AssemblyVersion\\(\").*?(?=\")");
        internal static readonly Regex SteamLogin    = new Regex("^(?=.*[A-Za-z0-9/*\\-.+_@!&$#%])(?!.*[/*\\-.+_@!&$#%]{2})[A-Za-z0-9/*\\-. +_@!&$#%]{3,64}$");
    }
}
