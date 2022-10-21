using Steam_Account_Manager.Infrastructure.Models.AccountModel;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Collections.ObjectModel;
using System.Globalization;
using System.Linq;
using System.Security;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.Infrastructure.Models
{
    internal enum Themes : byte
    {
        Dark = 0,
        Light = 1,
        Nebula = 2
    }

    internal enum Languages : byte
    {
        English = 0,
        Russian = 1,
        Ukrainian = 2
    }

    [Serializable]
    internal sealed class ConfigProperties
    {
        public string SteamDirection { get; set; }
        public bool NoConfirmMode { get; set; }
        public bool TakeAccountInfo { get; set; }
        public bool AutoClose { get; set; }
        public bool AutoGetSteamId { get; set; }
        public bool RememberPassword { get; set; }
        public bool MinimizeToTray { get; set; }
        public string WebApiKey { get; set; }
        public string UserCryptoKey { get; set; }
        public string Password { get; set; }
        public List<RecentlyLoggedUser> RecentlyLoggedUsers { get; set; }


        private Themes theme;
        public Themes Theme
        {
            get => theme;
            set
            {
                theme = value;
                ResourceDictionary dict = new ResourceDictionary();
                switch (value)
                {
                    case Themes.Light:
                        dict.Source = new Uri("Themes/ColorSchemes/Light.xaml", UriKind.Relative);
                        break;
                    case Themes.Dark:
                        dict.Source = new Uri("Themes/ColorSchemes/Dark.xaml", UriKind.Relative);
                        break;
                    case Themes.Nebula:
                        dict.Source = new Uri("Themes/ColorSchemes/Nebula.xaml", UriKind.Relative);
                        break;
                    default:
                        dict.Source = new Uri("Themes/ColorSchemes/Light.xaml", UriKind.Relative);
                        break;
                }
                ResourceDictionary oldDict = (from d in Application.Current.Resources.MergedDictionaries
                                              where d.Source != null && d.Source.OriginalString.StartsWith("Themes/ColorSchemes/")
                                              select d).First();
                if (oldDict != null)
                {
                    int ind = Application.Current.Resources.MergedDictionaries.IndexOf(oldDict);
                    Application.Current.Resources.MergedDictionaries.Remove(oldDict);
                    Application.Current.Resources.MergedDictionaries.Insert(ind, dict);
                }
                else
                {
                    Application.Current.Resources.MergedDictionaries.Add(dict);
                }
            }
        }


        private Languages language;
        public Languages Language 
        {
            get => language;
            set
            {
                language = value;
                ResourceDictionary dict = new ResourceDictionary();
                switch (value)
                {
                    case Languages.English:
                        dict.Source = new Uri($"Locale/lang.en-US.xaml", UriKind.Relative);
                        Thread.CurrentThread.CurrentUICulture = new CultureInfo("en-US");
                        break;

                    case Languages.Russian:
                        dict.Source = new Uri($"Locale/lang.ru-RU.xaml", UriKind.Relative);
                        Thread.CurrentThread.CurrentUICulture = new CultureInfo("ru-RU");
                        break;

                    case Languages.Ukrainian:
                        dict.Source = new Uri($"Locale/lang.uk-UA.xaml", UriKind.Relative);
                        Thread.CurrentThread.CurrentUICulture = new CultureInfo("uk-UA");
                        break;

                    default:
                        dict.Source = new Uri("Locale/lang.en-US.xaml", UriKind.Relative);
                        Thread.CurrentThread.CurrentUICulture = new CultureInfo("en-US");
                        break;
                }
                ResourceDictionary oldDict = (from d in Application.Current.Resources.MergedDictionaries
                                              where d.Source != null && d.Source.OriginalString.StartsWith("Locale/lang.")
                                              select d).First();
                if (oldDict != null)
                {
                    var ind = Application.Current.Resources.MergedDictionaries.IndexOf(oldDict);
                    Application.Current.Resources.MergedDictionaries.Remove(oldDict);
                    Application.Current.Resources.MergedDictionaries.Insert(ind, dict);
                }
                else
                {
                    Application.Current.Resources.MergedDictionaries.Add(dict);
                }
            }
        }
    }


    [Serializable]
    internal sealed class RecentlyLoggedUser
    {
        public string Nickname;
        public bool IsRewritable { get; set; }
        public string SteamID64 { get; set; }

        public override string ToString()
        {
            return Nickname;
        }
    }
}
