using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.View.Controls;
using System;
using System.Threading.Tasks;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Threading;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        public RelayCommand SettingsCommand { get; }

        public SettingsView Settings { get; private set; }


        private BitmapImage _loggedInImage = null;
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


        public MainWindowViewModel()
        {


            SettingsCommand = new RelayCommand(OnOpeningSettings);
        }
    }
}
