using SteamOrganizer.MVVM.ViewModels;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.View.Controls
{
    public sealed partial class SettingsView : Grid
    {
        public SettingsView()
        {
            InitializeComponent();
            this.DataContext = new SettingsViewModel();
        }

        private void OpenSource(object sender, System.Windows.RoutedEventArgs e)
            => System.Diagnostics.Process.Start("https://github.com/k1tbyte/Steam-Organizer").Dispose();
        
    }
}
