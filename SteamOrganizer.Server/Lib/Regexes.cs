using System.Text.RegularExpressions;

namespace SteamOrganizer.Server.Lib;

public static partial class Regexes
{
    public static readonly Regex Currency = CurrencyRegex();

    [GeneratedRegex(@"\d+(\.\d+)?")]
    private static partial Regex CurrencyRegex();
}