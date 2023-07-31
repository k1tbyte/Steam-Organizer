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
    }
}
