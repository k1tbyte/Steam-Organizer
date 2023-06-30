using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.View.Controls;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        public RelayCommand SettingsCommand { get; }

        public MainWindowViewModel()
        {
            SettingsCommand = new RelayCommand((o) =>
            {
                App.MainWindow.OpenPopupWindow(new AuthenticationView(),App.FindString("av_title"), () => App.Shutdown());
            });
        }
    }
}
