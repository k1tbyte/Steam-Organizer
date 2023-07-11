using SteamOrganizer.MVVM.ViewModels;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.View.Controls
{
    public partial class AccountAddingView : StackPanel
    {
        public AccountAddingView()
        {
            InitializeComponent();
            DataContext = new AccountAddingViewModel();
        }
    }
}
