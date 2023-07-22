using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.ViewModels;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.View.Controls
{
    public partial class AccountPageView : Grid
    {
        private AccountPageViewModel ViewModel;
        private bool isLoginToolTipShown;

        internal AccountPageView()
        {
            InitializeComponent();
        }

        internal void OpenPage(Account account)
        {
            if(ViewModel == null || !ViewModel.CurrentAccount.Equals(account))
            {
                this.DataContext             = ViewModel = new AccountPageViewModel(this,account);
                IDComboBox.SelectedIndex     = 0;
                SteamExpander.IsExpanded     = LinksExpander.IsExpanded = false;
                Scroll.ScrollToTop();
                return;
            }

            //We use an already existing data context. So we need to resume background work
            ViewModel.ResumeBackgroundWorkers();
        }

        internal void Dispose()
        {
            ViewModel.StopBackgroundWorkers();
        }

        private void OpenOtherLink(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if(sender is TextBlock block)
            {
                ViewModel.CurrentAccount.OpenInBrowser($"/{block.Text.ToLowerInvariant()}");
            }

        }

        private void AutoSaveTextChanged(object sender, TextChangedEventArgs e)
        {
            App.Config.SaveDatabase(3000);
        }

        private async void ShowRevocationCode(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            var control    = sender as FrameworkElement;

            if (control.Effect == null)
                return;

            var effect     = control.Effect;
            control.Effect = null;
            await Task.Delay(3000);
            control.Effect = effect;
        }


        private async void LoginPreviewTextInput(object sender, System.Windows.Input.TextCompositionEventArgs e)
        {
            e.Handled = true;
            if (isLoginToolTipShown)
            {
                return;
            }

            isLoginToolTipShown = true;
            await Utils.OpenAutoClosableToolTip(sender as FrameworkElement, App.FindString("apv_uniq_login_tip"), 3000);
            isLoginToolTipShown = false;
        }
    }
}
