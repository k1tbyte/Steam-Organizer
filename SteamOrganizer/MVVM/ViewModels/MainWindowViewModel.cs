using SteamOrganizer.MVVM.Core;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        public RelayCommand SettingsCommand { get; }

        public MainWindowViewModel()
        {
            SettingsCommand = new RelayCommand((o) =>
            {
                App.MainWindow.OpenPopupWindow("Slava fisting anuss", () => App.Shutdown());
            });
        }
    }
}
