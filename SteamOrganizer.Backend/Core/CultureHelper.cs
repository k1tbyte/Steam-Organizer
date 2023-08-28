using System.Globalization;

namespace SteamOrganizer.Backend.Core;

public sealed class CultureHelper
{
    private readonly CultureTypes cultureType;

    public static readonly CountryInfo Default = new ()
    {
        Culture = new CultureInfo("en-US"),
        Region = new RegionInfo("en-US")
    };

    public CultureHelper(bool AllCultures)
    {
        cultureType = AllCultures ? CultureTypes.AllCultures : CultureTypes.SpecificCultures;
        Countries = GetAllCountries(cultureType);
    }

    public List<CountryInfo> Countries { get; set; }

    public List<CountryInfo> GetCountryInfoByName(string CountryName, bool NativeName)
    {
        return NativeName ? Countries.Where(info => info.Region?.NativeName == CountryName).ToList()
                          : Countries.Where(info => info.Region?.EnglishName == CountryName).ToList();
    }

    public List<CountryInfo> GetCountryInfoByName(string CountryName, bool NativeName, bool IsNeutral)
    {
        return NativeName ? Countries.Where(info => info.Region?.NativeName == CountryName &&
                                                    info.Culture?.IsNeutralCulture == IsNeutral).ToList()
                          : Countries.Where(info => info.Region?.EnglishName == CountryName &&
                                                    info.Culture?.IsNeutralCulture == IsNeutral).ToList();
    }

    public string? GetTwoLettersName(string CountryName, bool NativeName)
    {
        CountryInfo? country = NativeName ? Countries.Where(info => info.Region?.NativeName == CountryName).FirstOrDefault()
                                          : Countries.Where(info => info.Region?.EnglishName == CountryName).FirstOrDefault();

        return country?.Region?.TwoLetterISORegionName;
    }

    public string? GetThreeLettersName(string CountryName, bool NativeName)
    {
        CountryInfo? country = NativeName ? Countries.Where(info => info.Region?.NativeName == CountryName).FirstOrDefault()
                                          : Countries.Where(info => info.Region?.EnglishName == CountryName).FirstOrDefault();

        return country?.Region?.ThreeLetterISORegionName;
    }

    public CultureInfo? GetCultureByName(string? CountryName)
    {
        if (CountryName == null)
            return null;

        return Countries.Where(info => info.Region?.EnglishName == CountryName && info.Culture!.IetfLanguageTag.Contains('-'))
            .Select(o => o.Culture).FirstOrDefault();
    }

    public CountryInfo? GetCultureByTwoLetterCode(string? code)
    {
        if (code == null)
            return null;

        return Countries.Where(info => info.Culture?.Name?.EndsWith(code, StringComparison.OrdinalIgnoreCase) == true &&
            info.Region != null && info.Region.CurrencySymbol != info.Region.ISOCurrencySymbol).FirstOrDefault();
    }

    public List<int?> GetRegionGeoId(string CountryName, bool UseNativeName)
    {
        return UseNativeName ? Countries.Where(info => info.Region?.NativeName == CountryName)
                                        .Select(info => info.Region?.GeoId).ToList()
                             : Countries.Where(info => info.Region?.EnglishName == CountryName)
                                        .Select(info => info.Region?.GeoId).ToList();
    }

    public string FormatCurrency(CountryInfo info, decimal currency)
    {
        var formatted = currency.ToString(currency % 1 == 0 ? "C0" : "C2", info.Culture);

        if (formatted.Contains('$') && info.Region!.ISOCurrencySymbol != "USD")
        {
            var index = formatted.IndexOf('$') + 1;
            var spaced = index < formatted.Length && formatted[index] == ' ';
            formatted = formatted.Replace("$", info.Region!.ISOCurrencySymbol + (spaced ? "$": "$ "));
        }

        return formatted;
    }

    private static List<CountryInfo> GetAllCountries(CultureTypes cultureTypes)
    {
        var countries = new List<CountryInfo>();

        foreach (CultureInfo culture in CultureInfo.GetCultures(cultureTypes))
        {
            if (culture.LCID != 127)
                countries.Add(new CountryInfo()
                {
                    Culture = culture,
                    Region = new RegionInfo(culture.TextInfo.CultureName)
                });
        }
        return countries;
    }

    public sealed class CountryInfo
    {
        public CultureInfo? Culture { get; set; }
        public RegionInfo? Region { get; set; }
    }
}