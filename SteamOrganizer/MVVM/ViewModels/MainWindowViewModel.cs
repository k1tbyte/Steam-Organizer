using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.View.Controls;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        public RelayCommand SettingsCommand { get; }

        public SettingsView Settings { get; private set; }

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
