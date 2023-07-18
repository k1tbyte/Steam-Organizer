using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.ViewModels;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.View.Controls
{
    public partial class AccountPageView : Grid
    {
        private AccountPageViewModel ViewModel;
        internal AccountPageView()
        {
            InitializeComponent();
        }

        internal void OpenPage(Account account)
        {
            account.ThrowIfNull();

            if(ViewModel == null || !ViewModel.CurrentAccount.Equals(account))
            {
                this.DataContext             = ViewModel = new AccountPageViewModel(account);
                IDComboBox.SelectedIndex = 0;
                SteamExpander.IsExpanded = LinksExpander.IsExpanded = false;
                Scroll.ScrollToTop();
            }

            App.MainWindowVM.CurrentView = this;
        }

        private void OpenOtherLink(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if(sender is TextBlock block)
            {
                ViewModel.CurrentAccount.OpenInBrowser($"/{block.Text.ToLowerInvariant()}");
            }

        }

        ~AccountPageView()
        {
            System.Windows.MessageBox.Show("Disposed");
            System.IO.File.WriteAllText("D:\\test.txt", "disposed");
        }
    }
}
