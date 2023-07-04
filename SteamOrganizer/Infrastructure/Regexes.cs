using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace SteamOrganizer.Infrastructure
{
    internal static class Regexes
    {
        internal static readonly Regex AvatarHashXml = new Regex("(?<=https:\\/\\/avatars\\.akamai\\.steamstatic\\.com\\/)[a-zA-Z0-9]+");
        internal static readonly Regex NicknameXml   = new Regex("(?<=<steamID><!\\[CDATA\\[).*?(?=\\]\\]>)");
        internal static readonly Regex SteamId64Xml  = new Regex("(?<=<steamID64>).*?(?=</steamID64>)");

    }
}
