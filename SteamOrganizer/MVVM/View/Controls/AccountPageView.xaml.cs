using SteamOrganizer.Helpers.Encryption;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.ViewModels;
using System;
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
            this.DataContext         = ViewModel = new AccountPageViewModel(this, account);
            IDComboBox.SelectedIndex = 0;
            LinksExpander.IsExpanded = false;
            UpdateButton.Visibility  = Visibility.Visible;
            Scroll.ScrollToTop();
        }

        internal void Dispose()
        {
            ViewModel.Dispose();
        }

        private void OpenOtherLink(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if(sender is TextBlock block)
            {
                ViewModel.CurrentAccount.OpenInBrowser($"/{block.Text.ToLowerInvariant()}");
            }

        }

        private void AutoSaveTextInput(object sender, System.Windows.Input.TextCompositionEventArgs e)
            => App.Config.SaveDatabase(3000);
        

        private void PasswordBox_LostFocus(object sender, RoutedEventArgs e)
            => App.Config.SaveDatabase(3000);
        

        private async void ShowRevocationCode(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            var control    = sender as TextBlock;

            if (control.Effect == null)
                return;

            var effect     = control.Effect;
            var text       = control.Text;
            control.Effect = null;
            control.Text   = EncryptionTools.XorString(ViewModel.CurrentAccount.Authenticator.Revocation_code);
            await Task.Delay(3000);
            control.Effect = effect;
            control.Text   = text;
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

        int i = 0;
        private void BitmapImage_DownloadCompleted(object sender, System.EventArgs e)
        {
            Console.WriteLine(++i);
        }
    }
}
