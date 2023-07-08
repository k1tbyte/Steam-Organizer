using SteamOrganizer.MVVM.ViewModels;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.View.Controls
{
    public partial class AccountsView : UserControl
    {
        public AccountsView()
        {
            InitializeComponent();
            this.DataContext = new AccountsViewModel();
        }
    }
}
