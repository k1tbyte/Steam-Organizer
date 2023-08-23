using System.Text.RegularExpressions;

namespace SteamOrganizer.Backend.Core;

public static partial class Regexes
{
    [GeneratedRegex("var stats =(.*?);", RegexOptions.Singleline)]
    public static partial Regex CsgoStatsJson();
}
