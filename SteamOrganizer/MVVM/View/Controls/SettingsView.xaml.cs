using SteamOrganizer.MVVM.ViewModels;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.View.Controls
{
    public partial class SettingsView : StackPanel
    {
        public SettingsView()
        {
            InitializeComponent();
            this.DataContext = new SettingsViewModel();
        }
    }
}
