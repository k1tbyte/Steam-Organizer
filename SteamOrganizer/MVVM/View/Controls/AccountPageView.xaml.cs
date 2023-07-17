using SteamOrganizer.MVVM.ViewModels;
using System.Windows.Controls;
using SteamOrganizer.MVVM.Models;

namespace SteamOrganizer.MVVM.View.Controls
{
    public partial class AccountPageView : ScrollViewer
    {
        internal AccountPageView(Account account)
        {
            InitializeComponent();
            this.DataContext = new AccountPageViewModel(account);
        }
    }
}
