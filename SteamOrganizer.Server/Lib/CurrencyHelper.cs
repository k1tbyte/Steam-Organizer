using System.Collections.Frozen;
using System.Globalization;
using System.Text;

namespace SteamOrganizer.Server.Lib;

public sealed class Currency
{
    public static readonly FrozenDictionary<string, Currency> Currencies = new Currency[]
    {
        new("UAH","UA", "uk-UA"),
        new("BRL","BR", "es-BR"),
        new("CNY","CN", "bo-CN"),
        new("USD","US", "en-US"),
        new("COP","CO", "es-CO", "COL$"),
        new("JPY","JP", "ja-JP"),
        new("UYU","UY", "es-UY", "$U"),
        new("KZT","KZ", "kk-KZ"),
        new("PHP","PH", "ceb-PH"),
        new("KRW","KR", "ko-KR"),
        new("CLP","CL", "es-CL", "CLP$ "),
        new("IDR","ID", "id-ID"),
        new("ZAR","ZA", "af-ZA"),
        new("MYR","MY", "en-MY"),
        new("PEN","PE", "es-PE"),
        new("VND","VN", "vi-VN"),
        new("THB","TH", "th-TH"),
        new("CAD","CA", "en-CA", "CDN$ "),
        new("TWD","TW", "zh-TW", "NT$ "),
        new("NOK", "NO", "no-NO"),
        new("INR", "IN", "as-IN"),
        new("MXN", "MX", "es-MX", "Mex$ "),
        new("PLN", "PL", "pl-PL"),
        new("HKD", "HK", "en-HK"),
        new("SGD", "SG", "en-SG", "S$"),
        new("GBP", "GB", "cy-GB"),
        new("EUR", "FR", "fr-FR"),
        new("CRC", "CR", "es-CR"),
        new("ILS", "IL", "ar-IL"),
        new("KWD", "KW", "ar-KW"),
        new("AUD", "AU", "en-AU", "A$ "),
        new("SAR", "SA", "ar-SA"),
        new("AED", "AE", "ar-AE"),
        new("NZD", "NZ", "en-NZ", "NZ$ "),
        new("QAR", "QA", "ar-QA"),
        new("CHF", "CH", "de-CH"),
        new("RUB", "RU", "ru-RU"),
    }.ToFrozenDictionary(o => o.Name);

    public static readonly Currency Default = Currencies["USD"];
    
    public readonly CultureInfo Culture;
    public readonly string Name;
    public readonly string CountryCode;
    
    public Currency(string name,string countryCode, string locale, string? currencySymbol = null)
    {
        Name = name;
        CountryCode = countryCode;
        Culture = new CultureInfo(locale);
        if (currencySymbol != null)
        {
            Culture.NumberFormat.CurrencySymbol = currencySymbol;
        }
    }

    public override int GetHashCode() => Name.GetHashCode();

    public override bool Equals(object? obj) => Name.Equals(obj);

    public string Format(decimal currency)
    {
        return currency.ToString(currency % 1 == 0 ? "C0" : "C2", Culture);
    }
}