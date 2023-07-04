using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.View.Controls;
using System;
using System.Management;
using System.Security.Principal;
using System.Threading.Tasks;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        private ManagementEventWatcher RegistrySteamUserWatcher;
        public RelayCommand SettingsCommand { get; }

        public SettingsView Settings { get; private set; }


        private BitmapImage _loggedInImage = null;
        private string _loggedInNickname;
        public string LoggedInNickname
        {
            get => _loggedInNickname;
            set => SetProperty(ref _loggedInNickname, value);
        }
        public BitmapImage LoggedInImage 
        {
            get => _loggedInImage;
            set => SetProperty(ref _loggedInImage, value);
        }

        public void OnOpeningSettings(object param)
        {
            Settings = Settings ?? new SettingsView();
            App.Config.IsPropertiesChanged = true;
            App.MainWindow.OpenPopupWindow(Settings, App.FindString("sv_title"));
        }

        private async void OnLocalLoggedInUserChanged(object sender, EventArrivedEventArgs args)
        {
            var userId = Convert.ToUInt32(Utils.GetUserRegistryValue(App.RegistryPathSteamActiveProces, "ActiveUser"));

            if (userId == 0)
            {
                LoggedInImage = null;
                LoggedInNickname = null;
                return;
            }    
                
            var xmlPage = await App.WebBrowser.GetStringAsync($"{WebBrowser.SteamProfilesHost}{SteamIdConverter.SteamID32ToID64(userId)}?xml=1");

            var imgHash  = Regexes.AvatarHashXml.Match(xmlPage)?.Groups[0]?.Value;
            var nickname = Regexes.NicknameXml.Match(xmlPage)?.Groups[0]?.Value;

            if (string.IsNullOrEmpty(imgHash) || string.IsNullOrEmpty(nickname))
                return;

            LoggedInImage = CachingManager.GetCachedAvatar(imgHash, 80,80);
            LoggedInNickname = $"{App.FindString("word_wlcbck")}, {nickname}";
        }

        private void InitServices()
        {
            RegistrySteamUserWatcher = new ManagementEventWatcher(
                new WqlEventQuery($"SELECT * FROM RegistryValueChangeEvent WHERE Hive = 'HKEY_USERS'" +
                                  $@"AND KeyPath = '{WindowsIdentity.GetCurrent().User.Value}\\SOFTWARE\\Valve\\Steam\\ActiveProcess' AND ValueName='ActiveUser'"));
            RegistrySteamUserWatcher.EventArrived += new EventArrivedEventHandler(OnLocalLoggedInUserChanged);
            RegistrySteamUserWatcher.Start();
            OnLocalLoggedInUserChanged(null, null);
        }

        public MainWindowViewModel()
        {
#if !DEBUG
            Utils.InBackground(InitServices);
#endif

            SettingsCommand = new RelayCommand(OnOpeningSettings);
        }
    }
}
