using SteamOrganizer.MVVM.ViewModels;
using System.Windows.Controls;
using SteamOrganizer.MVVM.Models;
using System.Diagnostics;

namespace SteamOrganizer.MVVM.View.Controls
{
    public partial class AccountPageView : ScrollViewer
    {
        private readonly AccountPageViewModel ViewModel;
        internal AccountPageView(Account account)
        {
            InitializeComponent();
            this.DataContext = ViewModel = new AccountPageViewModel(account);
        }

        private void OpenOtherLink(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if(sender is TextBlock block)
            {
                ViewModel.CurrentAccount.OpenInBrowser($"/{block.Text.ToLowerInvariant()}");
            }

        }
    }
}
