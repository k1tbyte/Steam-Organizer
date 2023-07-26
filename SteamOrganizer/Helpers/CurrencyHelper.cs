using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace SteamOrganizer.Helpers
{
    internal static class CurrencyHelper
    {
        private static IDictionary<string, string> CurrencyMap;
        private static void Initialize()
        {
            CurrencyMap = CultureInfo
                .GetCultures(CultureTypes.AllCultures)
                .Where(c => !c.IsNeutralCulture)
                .Select(culture => {
                    try
                    {
                        return new RegionInfo(culture.Name);
                    }
                    catch
                    {
                        return null;
                    }
                })
                .Where(ri => ri != null)
                .GroupBy(ri => ri.ISOCurrencySymbol)
                .ToDictionary(x => x.Key, x => x.First().CurrencySymbol);
        }
        public static bool TryGetCurrencySymbol(
                              string ISOCurrencySymbol,
                              out string symbol)
        {
            if (CurrencyMap == null)
                Initialize();

            return CurrencyMap.TryGetValue(ISOCurrencySymbol, out symbol);
        }
    }
}
